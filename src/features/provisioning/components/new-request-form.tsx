import {
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSignedOutError } from "@/features/auth/utils";
import { API_ERROR_COPY, apiErrorCode } from "../api/errors";
import { modulesQueryOptions, provisioningKeys } from "../api/queries";
import {
  approveRequest,
  checkOrderPrefix,
  createRequest,
} from "../api/service";
import type { SurveyInfo } from "../api/types";
import { formatDateTime } from "../lib/format";
import { answerText } from "../lib/survey";
import {
  DELIVERY_MODULE,
  DISABLED_MODULES,
  MAX_VEHICLES_PER_TYPE,
  SUPPLIER_CATEGORIES,
  type SignupPayload,
  VAN_MODULE,
  VEHICLE_REQUIRED,
  fieldErrors,
  signupSchema,
} from "../schemas/signup";
import { adminUsername, vehicleRange, vehicleUsername } from "../lib/logins";
import { describeBrands } from "../lib/catalog-selection";
import {
  alphanumeric,
  decimalChars,
  digitsOnly,
  noSpaces,
  phoneChars,
  usernameChars,
  uuidChars,
} from "../lib/input-filters";
import { AddressFields, type AddressValue } from "./address-fields";
import { ApiErrorPanel } from "./api-error";
import { CatalogPicker } from "./catalog-picker";
import {
  Choice,
  Field,
  FormSection,
  SelectField,
  TextField,
  fieldId,
  filteredValue,
} from "./form-fields";

const EMPTY_FORM = {
  supplier_name: "",
  contact_phone: "",
  contact_email: "",
  order_prefix: "",
  category: "",
  province: "",
  district: "",
  sub_district: "",
  zipcode: "",
  latitude: "",
  longitude: "",
  erp_name: "",
  source_supplier_id: "",
  source_customer_id: "",
  source_region: "",
  admin_username: "",
  admin_password: "",
  van_count: "",
  delivery_count: "",
};

type TextKey = keyof typeof EMPTY_FORM;

// Look-alike characters are left out, because this password is read out or typed from a message.
const PASSWORD_ALPHABET =
  "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERATED_PASSWORD_LENGTH = 14;

function generatePassword() {
  const values = crypto.getRandomValues(
    new Uint32Array(GENERATED_PASSWORD_LENGTH),
  );
  return Array.from(
    values,
    (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length],
  ).join("");
}

function sendFailure(error: unknown) {
  if (isSignedOutError(error)) {
    return "เซสชันหมดอายุ เปิดแท็บใหม่เพื่อเข้าสู่ระบบ แล้วกลับมากดส่งอีกครั้ง ข้อมูลในฟอร์มยังอยู่";
  }
  const code = apiErrorCode(error);
  if (code === "unreachable") {
    return "ไม่ได้รับคำตอบจาก API คำขออาจถูกบันทึกแล้ว ตรวจในรายการคำขอก่อนส่งซ้ำ";
  }
  return API_ERROR_COPY[code].title;
}

/** Set when this form completes a waiting request (survey or CCPlus) instead of creating a new one. */
export type ApprovalPrefill = {
  requestId: string;
  /** Where the locked values came from, as hints say it after จาก: แบบสำรวจ, or " CCPlus" with a space. */
  from: string;
  supplierName: string;
  province: string;
  /** Stored only when the survey's answer passed the API's rules, so a stored one is locked. */
  contactPhone: string | null;
  contactEmail: string | null;
  modules: string[];
  survey: SurveyInfo | null;
  /** The brands the survey's product types map to. They stay editable. */
  catalogBrands: string[];
  /** What CCPlus gave besides the locked values. They start the form and stay editable. */
  start?: Partial<
    Pick<
      typeof EMPTY_FORM,
      | "order_prefix"
      | "category"
      | "district"
      | "sub_district"
      | "zipcode"
      | "latitude"
      | "longitude"
    >
  >;
  /** Where the products come from, which CCPlus decides. The API keeps them, so they are shown locked. */
  source?: { supplierId: string; customerId: string };
  /**
   * The CCPlus user_id when the tenant takes its ids from CCPlus. That user is the admin and keeps
   * its own username, so the username field is locked. The password still applies to it.
   */
  existingAdminUserId?: string;
};

const ORDER_PREFIX_PATTERN = /^[A-Za-z0-9]{2,4}$/;

/** The last prefix someone checked, and what the check said. */
type PrefixCheck = {
  prefix: string;
  result: "available" | "taken" | "requested" | "failed";
};

const PREFIX_PROBLEM: Record<
  Exclude<PrefixCheck["result"], "available">,
  string
> = {
  taken: "Prefix นี้มี Tenant ใช้แล้ว เลือกใหม่",
  requested: "Prefix นี้อยู่ในคำขออื่นที่ยังไม่จบ เลือกใหม่",
  failed: "ตรวจ prefix ไม่ได้ตอนนี้ ลองกดตรวจสอบอีกครั้ง",
};

/** What the customer answered, shown in place and locked, so the reviewer reads it beside the form. */
function SurveySection({ survey }: { survey: SurveyInfo }) {
  return (
    <FormSection
      title="ข้อมูลจากแบบสำรวจ"
      description="ตามที่ลูกค้ากรอก แก้ไม่ได้ ชื่อกิจการ เบอร์โทร อีเมล และจังหวัดถูกใส่ในช่องด้านล่างให้แล้ว"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {survey.answers.map((answer, index) => (
          <TextField
            key={answer.question_id}
            path={`survey.${index}`}
            label={answer.question_name}
            value={answerText(answer, formatDateTime) || "ไม่ได้กรอก"}
            disabled
            onValueChange={() => {}}
          />
        ))}
        {survey.line_sub_id && (
          <TextField
            path="survey.line"
            label="LINE"
            value={survey.line_sub_id}
            disabled
            className="font-mono"
            onValueChange={() => {}}
          />
        )}
      </div>
    </FormSection>
  );
}

export function NewRequestForm({ approval }: { approval?: ApprovalPrefill }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createRequest);
  const approveFn = useServerFn(approveRequest);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const reviewTitleId = useId();

  const moduleOptions = useQuery(modulesQueryOptions());

  const checkPrefixFn = useServerFn(checkOrderPrefix);
  // The survey's own answers are what the customer told us, so the reviewer cannot change them.
  const lockedName = Boolean(approval?.supplierName);
  const lockedProvince = Boolean(approval?.province);
  const lockedPhone = Boolean(approval?.contactPhone);
  const lockedEmail = Boolean(approval?.contactEmail);
  const lockedSource = Boolean(approval?.source);
  const lockedHint = `จาก${approval?.from ?? "แบบสำรวจ"} แก้ไม่ได้`;
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...approval?.start,
    source_supplier_id: approval?.source?.supplierId ?? "",
    source_customer_id: approval?.source?.customerId ?? "",
    supplier_name: approval?.supplierName ?? "",
    contact_phone: approval?.contactPhone ?? "",
    contact_email: approval?.contactEmail ?? "",
    province: approval?.province ?? "",
  });
  const [prefixCheck, setPrefixCheck] = useState<PrefixCheck | null>(null);
  const [modules, setModules] = useState<string[]>(
    (approval?.modules ?? []).filter(
      (code) => !DISABLED_MODULES.includes(code),
    ),
  );
  const [hasErp, setHasErp] = useState(false);
  const [hasSource, setHasSource] = useState(lockedSource);
  const [catalogBrands, setCatalogBrands] = useState<string[]>(
    approval?.catalogBrands ?? [],
  );
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState<SignupPayload | null>(null);
  const [focusErrors, setFocusErrors] = useState(0);
  const dirty = useRef(false);
  const leaving = useRef(false);

  const submit = useMutation({
    mutationFn: (data: SignupPayload) =>
      approval
        ? approveFn({ data: { id: approval.requestId, signup: data } })
        : createFn({ data }),
    onSuccess: async (result) => {
      if (result.id === undefined) return;
      leaving.current = true;
      void queryClient.invalidateQueries({ queryKey: provisioningKeys.all });
      await navigate({
        to: "/dashboard/provisioning/$id",
        params: { id: result.id },
      });
    },
  });

  const shouldWarn = () => dirty.current && !leaving.current;
  useBlocker({
    shouldBlockFn: () =>
      shouldWarn() &&
      !window.confirm("ข้อมูลที่กรอกจะหายไป ต้องการออกจากหน้านี้ไหม"),
    enableBeforeUnload: shouldWarn,
  });

  useEffect(() => {
    if (focusErrors === 0) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [focusErrors]);

  useEffect(() => {
    if (review) reviewRef.current?.focus();
  }, [review]);

  /** Any edit makes the review stale, and clears that field's error. */
  function edited(path: string) {
    dirty.current = true;
    setReview(null);
    submit.reset();
    setErrors((current) => {
      if (!(path in current)) return current;
      const { [path]: _removed, ...rest } = current;
      return rest;
    });
  }

  function setText(key: TextKey, value: string) {
    edited(key);
    // A check is for the prefix it was made with.
    if (key === "order_prefix") setPrefixCheck(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  /** A choice in one address list also clears the levels below it, so they change together. */
  function setAddress(patch: Partial<AddressValue>) {
    for (const key of Object.keys(patch)) edited(key);
    setForm((current) => ({ ...current, ...patch }));
  }

  const text = (key: TextKey) => ({
    path: key,
    value: form[key],
    error: errors[key],
    onValueChange: (value: string) => setText(key, value),
  });

  const verify = useMutation({
    mutationFn: (prefix: string) =>
      checkPrefixFn({ data: { prefix, except: approval?.requestId } }),
    onSuccess: (check, prefix) => {
      const result = check.available
        ? "available"
        : check.reason === "requested"
          ? "requested"
          : "taken";
      setPrefixCheck({ prefix, result });
      setErrors((current) => {
        const { order_prefix: _removed, ...rest } = current;
        return result === "available"
          ? rest
          : { ...rest, order_prefix: PREFIX_PROBLEM[result] };
      });
    },
    onError: (_error, prefix) => {
      setPrefixCheck({ prefix, result: "failed" });
      setErrors((current) => ({
        ...current,
        order_prefix: PREFIX_PROBLEM.failed,
      }));
    },
  });

  function verifyPrefix() {
    const prefix = form.order_prefix.trim();
    if (!ORDER_PREFIX_PATTERN.test(prefix)) {
      setErrors((current) => ({
        ...current,
        order_prefix: "ใช้ตัวอักษรอังกฤษหรือตัวเลข 2–4 ตัว",
      }));
      return;
    }
    verify.mutate(prefix);
  }

  const prefixVerified = (prefix: string) =>
    prefixCheck?.prefix === prefix && prefixCheck.result === "available";

  const hasVanSale = modules.includes(VAN_MODULE);
  const hasLogistics = modules.includes(DELIVERY_MODULE);

  function formInput() {
    return {
      ...form,
      erp_name: hasErp ? form.erp_name : "",
      source_supplier_id: hasSource ? form.source_supplier_id : "",
      source_customer_id: hasSource ? form.source_customer_id : "",
      source_region: hasSource ? form.source_region : "",
      // A purchase history wins over a selection, so a choice left behind must not be sent.
      catalog_brands: hasSource ? [] : catalogBrands,
      modules,
      has_erp: hasErp,
      // A count of a module that is not ticked is kept on screen but not sent.
      van_count: hasVanSale ? form.van_count : "",
      delivery_count: hasLogistics ? form.delivery_count : "",
    };
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = signupSchema.safeParse(formInput());
    const found = parsed.success ? {} : fieldErrors(parsed.error);
    // The schema only checks these once every field is valid, so they are checked here as well:
    // someone who ticked a module should hear about its count on the first try.
    if (hasVanSale && !found.van_count && !(Number(form.van_count) >= 1)) {
      found.van_count = VEHICLE_REQUIRED.van_count;
    }
    if (
      hasLogistics &&
      !found.delivery_count &&
      !(Number(form.delivery_count) >= 1)
    ) {
      found.delivery_count = VEHICLE_REQUIRED.delivery_count;
    }
    // Only a prefix that passed its check may be sent.
    if (parsed.success && !prefixVerified(parsed.data.order_prefix)) {
      found.order_prefix =
        prefixCheck?.prefix === parsed.data.order_prefix &&
        prefixCheck.result !== "available"
          ? PREFIX_PROBLEM[prefixCheck.result]
          : "กดตรวจสอบ prefix ก่อนส่ง";
    }
    setErrors(found);
    if (!parsed.success || Object.keys(found).length > 0) {
      setReview(null);
      setFocusErrors((count) => count + 1);
      return;
    }
    setReview(parsed.data);
  }

  const refusal = submit.data?.error;
  const errorCount = Object.keys(errors).length;
  const prefixForUsername = form.order_prefix.trim() || "prefix";
  const selectable = moduleOptions.data?.modules ?? [];

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="max-w-5xl">
      {approval?.survey && <SurveySection survey={approval.survey} />}
      <FormSection
        title="ลูกค้า"
        description="ข้อมูลที่จะกลายเป็น Tenant ใน DMS"
      >
        <TextField
          {...text("supplier_name")}
          label="ชื่อ Tenant"
          autoFocus={!lockedName}
          maxLength={255}
          disabled={lockedName}
          hint={lockedName ? lockedHint : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            {...text("contact_phone")}
            label="เบอร์โทร"
            type="tel"
            inputMode="tel"
            filter={phoneChars}
            autoComplete="off"
            maxLength={20}
            disabled={lockedPhone}
            hint={
              lockedPhone
                ? lockedHint
                : approval
                  ? `${approval.from.trim()}${approval.from.startsWith(" ") ? " " : ""}ไม่มีเบอร์ที่ใช้ได้ กรอกเบอร์ที่ติดต่อลูกค้าได้`
                  : "เบอร์ที่ติดต่อลูกค้าได้ เช่น 081-234-5678"
            }
          />
          <TextField
            {...text("contact_email")}
            label="อีเมล"
            optional={!lockedEmail}
            type="email"
            inputMode="email"
            filter={noSpaces}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={255}
            disabled={lockedEmail}
            hint={lockedEmail ? lockedHint : undefined}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            path="order_prefix"
            label="Order prefix"
            error={errors.order_prefix}
            hint={
              prefixVerified(form.order_prefix.trim()) ? (
                <span className="inline-flex items-center gap-1 font-medium text-success">
                  <IconCircleCheck aria-hidden="true" className="size-3.5" />
                  ใช้ได้
                </span>
              ) : (
                "2–4 ตัว ห้ามซ้ำกับ Tenant อื่น กดตรวจสอบก่อนส่ง"
              )
            }
          >
            <div className="flex gap-1.5">
              <Input
                id={fieldId("order_prefix")}
                name="order_prefix"
                autoCapitalize="characters"
                spellCheck={false}
                value={form.order_prefix}
                aria-invalid={errors.order_prefix ? true : undefined}
                aria-describedby={`${fieldId("order_prefix")}-message`}
                onChange={(event) =>
                  setText("order_prefix", filteredValue(event, alphanumeric, 4))
                }
                onKeyDown={(event) => {
                  // Enter checks the prefix instead of sending the whole form.
                  if (event.key === "Enter") {
                    event.preventDefault();
                    verifyPrefix();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={verify.isPending}
                onClick={verifyPrefix}
              >
                {verify.isPending && (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                ตรวจสอบ
              </Button>
            </div>
          </Field>
          <SelectField
            {...text("category")}
            label="ประเภท"
            placeholder="เลือกประเภท"
            options={SUPPLIER_CATEGORIES}
          />
        </div>
      </FormSection>

      <FormSection
        title="ที่อยู่"
        description="ใช้เป็นที่อยู่ของ Tenant และศูนย์กระจายสินค้าแรก ถ้าไม่กรอกพิกัด ระบบจะเก็บเป็น 0"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AddressFields
            value={form}
            errors={errors}
            lockedProvince={lockedProvince}
            lockedFrom={approval?.from}
            onChange={setAddress}
          />
          <TextField
            {...text("latitude")}
            label="ละติจูด"
            optional
            inputMode="decimal"
            maxLength={12}
            filter={decimalChars}
            hint="ตัวอย่าง 13.7248"
          />
          <TextField
            {...text("longitude")}
            label="ลองจิจูด"
            optional
            inputMode="decimal"
            maxLength={12}
            filter={decimalChars}
            hint="ตัวอย่าง 100.5340"
          />
        </div>
      </FormSection>

      <FormSection
        title="Module"
        description="กำหนด feature, flag และ order status ของ Tenant"
      >
        {moduleOptions.isError ? (
          <ApiErrorPanel
            error={moduleOptions.error}
            onRetry={() => void moduleOptions.refetch()}
            retrying={moduleOptions.isFetching}
          />
        ) : (
          <fieldset
            aria-describedby={
              errors.modules ? `${fieldId("modules")}-message` : undefined
            }
          >
            <legend className="sr-only">เลือก module</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectable.map((module) => {
                const turnedOff = DISABLED_MODULES.includes(module.code);
                return (
                  <Choice
                    key={module.code}
                    type="checkbox"
                    name="modules"
                    value={module.code}
                    label={module.name}
                    invalid={
                      Boolean(errors.modules) &&
                      !module.is_base &&
                      !module.unavailable_reason &&
                      !turnedOff
                    }
                    checked={
                      module.is_base ||
                      (!turnedOff && modules.includes(module.code))
                    }
                    disabled={
                      module.is_base ||
                      Boolean(module.unavailable_reason) ||
                      turnedOff
                    }
                    note={
                      module.is_base
                        ? "รวมให้ทุก Tenant"
                        : turnedOff
                          ? "ปิดไว้ชั่วคราว ยังเลือกไม่ได้"
                          : module.unavailable_reason
                            ? "ยังเปิดไม่ได้ เพราะข้อมูลใน module master ยังไม่พร้อม"
                            : module.activation_phase === "erp_activation"
                              ? "เก็บไว้ก่อน ยังไม่เปิดจนกว่าจะถึง ERP Activation"
                              : undefined
                    }
                    onChange={(event) => {
                      edited("modules");
                      const { checked } = event.target;
                      setModules((current) =>
                        checked
                          ? [...current, module.code]
                          : current.filter((code) => code !== module.code),
                      );
                    }}
                  />
                );
              })}
            </div>
            {errors.modules && (
              <p
                id={`${fieldId("modules")}-message`}
                className="mt-2 text-xs text-destructive"
              >
                {errors.modules}
              </p>
            )}
          </fieldset>
        )}
      </FormSection>

      <FormSection
        title="ผู้ดูแลของ Tenant"
        description="บัญชีแรกที่ใช้เข้า DMS เว้นว่างได้ ระบบจะสร้างให้ ดูรหัสผ่านได้ในหน้าคำขอเมื่อตั้งเสร็จ แล้วส่งให้ลูกค้า"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {approval?.existingAdminUserId ? (
            <TextField
              {...text("admin_username")}
              label="ชื่อผู้ใช้"
              optional
              disabled
              value=""
              placeholder="ใช้ user เดิมของร้านใน CCPlus"
              hint={
                <>
                  user_id{" "}
                  <code className="font-mono">
                    {approval.existingAdminUserId}
                  </code>{" "}
                  ได้รหัสผ่านใหม่ ชื่อผู้ใช้คงเดิม
                </>
              }
            />
          ) : (
            <TextField
              {...text("admin_username")}
              label="ชื่อผู้ใช้"
              optional
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={80}
              filter={usernameChars}
              placeholder={adminUsername(prefixForUsername)}
              hint={
                <>
                  เว้นว่างเพื่อใช้{" "}
                  <code className="font-mono">
                    {adminUsername(prefixForUsername)}
                  </code>{" "}
                  ห้ามซ้ำทั้งระบบ
                </>
              }
            />
          )}
          <Field
            path="admin_password"
            label="รหัสผ่าน"
            optional
            error={errors.admin_password}
            hint="เว้นว่างให้ระบบสุ่ม ถ้ากรอกต้องมีอย่างน้อย 8 ตัว"
          >
            <div className="flex gap-1.5">
              <input
                id={fieldId("admin_password")}
                name="admin_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                spellCheck={false}
                maxLength={128}
                value={form.admin_password}
                aria-invalid={errors.admin_password ? true : undefined}
                aria-describedby={`${fieldId("admin_password")}-message`}
                onChange={(event) =>
                  setText("admin_password", event.target.value)
                }
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setText("admin_password", generatePassword());
                  setShowPassword(true);
                }}
              >
                สุ่มรหัส
              </Button>
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="รถ"
        description="ระบบสร้างบัญชีรถตามจำนวนที่กรอก module ที่เลือกต้องมีรถอย่างน้อย 1 คัน เพิ่มใน DMS ภายหลังได้อีก"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            {...text("van_count")}
            label="จำนวนรถเร่"
            optional={!hasVanSale}
            inputMode="numeric"
            maxLength={3}
            filter={digitsOnly}
            disabled={!hasVanSale}
            value={hasVanSale ? form.van_count : ""}
            hint={
              hasVanSale
                ? (vehicleRange(
                    "van",
                    Number(form.van_count) || 0,
                    prefixForUsername,
                  ) ??
                  `1 ถึง ${MAX_VEHICLES_PER_TYPE} คัน ชื่อผู้ใช้เป็น ${vehicleUsername("van", 1, prefixForUsername)} ไปเรื่อยๆ`)
                : "เลือก module Van Sale ก่อน"
            }
          />
          <TextField
            {...text("delivery_count")}
            label="จำนวนรถส่ง (POD)"
            optional={!hasLogistics}
            inputMode="numeric"
            maxLength={3}
            filter={digitsOnly}
            disabled={!hasLogistics}
            value={hasLogistics ? form.delivery_count : ""}
            hint={
              hasLogistics
                ? (vehicleRange(
                    "delivery",
                    Number(form.delivery_count) || 0,
                    prefixForUsername,
                  ) ??
                  `1 ถึง ${MAX_VEHICLES_PER_TYPE} คัน ชื่อผู้ใช้เป็น ${vehicleUsername("delivery", 1, prefixForUsername)} ไปเรื่อยๆ`)
                : "เลือก module Logistics ก่อน"
            }
          />
        </div>
      </FormSection>

      <FormSection title="เพิ่มเติม">
        <Choice
          type="checkbox"
          label="ลูกค้ามีระบบ ERP"
          note="เก็บไว้สำหรับ ERP Activation ยังไม่เปิดการส่งเอกสารไป ERP"
          checked={hasErp}
          onChange={(event) => {
            edited("erp_name");
            setHasErp(event.target.checked);
          }}
        />
        {hasErp && (
          <div className="sm:max-w-xs">
            <TextField {...text("erp_name")} label="ชื่อ ERP" maxLength={100} />
          </div>
        )}
        <Choice
          type="checkbox"
          label="ลูกค้าเคยซื้อจาก Supplier ในระบบ"
          note="สร้างสินค้าตั้งต้นจากประวัติซื้อ 3 เดือนล่าสุด และสร้าง Tenant ในฐานข้อมูลเดียวกับ Supplier นั้น"
          checked={hasSource}
          disabled={lockedSource}
          onChange={(event) => {
            edited("source_supplier_id");
            edited("source_customer_id");
            edited("catalog_brands");
            setHasSource(event.target.checked);
          }}
        />
        {hasSource && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              {...text("source_supplier_id")}
              label="Supplier ID เดิม"
              disabled={lockedSource}
              hint={
                lockedSource
                  ? `${lockedHint} (invited_by_supplier_id)`
                  : undefined
              }
              spellCheck={false}
              maxLength={36}
              filter={uuidChars}
              className="font-mono"
            />
            <TextField
              {...text("source_customer_id")}
              label="Customer ID ของลูกค้า"
              disabled={lockedSource}
              hint={lockedSource ? lockedHint : undefined}
              spellCheck={false}
              maxLength={36}
              filter={uuidChars}
              className="font-mono"
            />
            <TextField
              {...text("source_region")}
              label="Region เดิม"
              optional
              inputMode="numeric"
              maxLength={4}
              filter={digitsOnly}
              hint="ถ้าว่าง ระบบอ่านจาก Supplier เดิม"
            />
          </div>
        )}
      </FormSection>

      <FormSection
        title="สินค้าตั้งต้น"
        description="ไม่บังคับ เลือกแบรนด์จาก product master ราคาขายตั้งต้นของแต่ละ barcode คือราคาขายปลีกสูงสุด และแก้ได้ใน backoffice"
      >
        {hasSource ? (
          <p className="text-sm text-muted-foreground">
            สร้างสินค้าจากประวัติซื้อของลูกค้าแทน
            จึงไม่ต้องเลือกหมวดหมู่และแบรนด์
          </p>
        ) : (
          <CatalogPicker
            brands={catalogBrands}
            onChange={(next) => {
              edited("catalog_brands");
              setCatalogBrands(next);
            }}
          />
        )}
      </FormSection>

      <div className="border-t pt-6 lg:pl-[calc(15rem+2rem)]">
        {review ? (
          <section
            aria-labelledby={reviewTitleId}
            className="rounded-lg border bg-muted p-4"
          >
            <h2
              id={reviewTitleId}
              ref={reviewRef}
              tabIndex={-1}
              className="font-semibold outline-none"
            >
              ยืนยันการตั้ง {review.supplier_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ติดต่อ{" "}
              <span className="text-foreground tabular-nums">
                {review.contact_phone}
              </span>
              {review.contact_email && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-foreground">
                    {review.contact_email}
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ระบบจะเริ่มทันทีและยกเลิกไม่ได้ Prefix{" "}
              <code className="font-mono text-foreground">
                {review.order_prefix}
              </code>
              , ผู้ดูแล{" "}
              <code className="font-mono text-foreground">
                {approval?.existingAdminUserId
                  ? "user เดิมของร้านใน CCPlus"
                  : (review.admin_username ??
                    adminUsername(review.order_prefix))}
              </code>
              {!review.admin_password && " (สุ่มรหัสผ่าน)"},{" "}
              {review.modules.length} module,{" "}
              {review.van_count + review.delivery_count === 0
                ? "ไม่สร้างรถ"
                : [
                    review.van_count > 0 && `รถเร่ ${review.van_count} คัน`,
                    review.delivery_count > 0 &&
                      `รถส่ง ${review.delivery_count} คัน`,
                  ]
                    .filter(Boolean)
                    .join(" และ ")}
            </p>
            {review.catalog_brands.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                สินค้าตั้งต้นจาก product master แบรนด์{" "}
                {describeBrands(review.catalog_brands)}{" "}
                ราคาขายปลีกสูงสุดของแต่ละ barcode
              </p>
            )}
            {refusal && (
              <p
                role="alert"
                className="mt-2 text-sm break-words text-destructive"
              >
                API ไม่รับคำขอนี้: {refusal}
              </p>
            )}
            {submit.isError && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {sendFailure(submit.error)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={submit.isPending}
                onClick={() => submit.mutate(review)}
              >
                {submit.isPending && (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {approval
                  ? "อนุมัติและเริ่มตั้ง Tenant"
                  : "ยืนยันและเริ่มตั้ง Tenant"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submit.isPending}
                onClick={() => {
                  submit.reset();
                  setReview(null);
                }}
              >
                กลับไปแก้
              </Button>
            </div>
          </section>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit">
              {approval ? "ตรวจและอนุมัติ" : "ตรวจและส่งคำขอ"}
            </Button>
            {approval ? (
              <Button
                variant="ghost"
                nativeButton={false}
                render={
                  <Link
                    to="/dashboard/provisioning/$id"
                    params={{ id: approval.requestId }}
                  />
                }
              >
                ยกเลิก
              </Button>
            ) : (
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link to="/dashboard/provisioning" />}
              >
                ยกเลิก
              </Button>
            )}
            {errorCount > 0 && (
              <p role="alert" className="text-sm text-destructive">
                ยังมี {errorCount} ช่องที่ต้องแก้
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
