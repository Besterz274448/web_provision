import * as z from 'zod';

/** The values of the suppliers.category enum, which the API checks against the same list. */
export const SUPPLIER_CATEGORIES = [
  { value: 'agent', label: 'Agent' },
  { value: 'sub_agent', label: 'Sub agent' },
  { value: 'direct_sub', label: 'Direct sub' },
  { value: 'agent-non-tbv', label: 'Agent non-TBV' },
  { value: 'choakchai', label: 'Choakchai' },
  { value: 'bu', label: 'BU' },
  { value: 'test', label: 'Test' }
] as const;

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;
const USERNAME_RULE = 'ใช้ a-z, 0-9, จุด, ขีด หรือขีดล่าง 3–80 ตัว';
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const UUID_RULE = 'ต้องเป็น UUID เช่น 0f8fad5b-d9cb-469f-a165-70867728950e';

/** The API's rule: 9–15 digits once spaces and dashes are removed, with an optional leading +. */
const PHONE_DIGITS = /^\+?[0-9]{9,15}$/;
export const PHONE_RULE = 'กรอกตัวเลข 9–15 หลัก เว้นวรรคหรือขีดได้ เช่น 081-234-5678';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validPhone = (value: string) => PHONE_DIGITS.test(value.replace(/[ -]/g, ''));

const required = (label: string, max: number) =>
  z.string().trim().min(1, `กรอก${label}`).max(max, `${label}ยาวได้ไม่เกิน ${max} ตัว`);

const blankToNull = (value: unknown) =>
  value === null || value === undefined ? '' : String(value).trim();

const optional = (max: number) =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .max(max, `ยาวได้ไม่เกิน ${max} ตัว`)
      .transform((value) => value || null)
  );

const number = (message: string) => z.number({ error: message });

/** The most vehicles of one type a request can make, as the API allows. */
export const MAX_VEHICLES_PER_TYPE = 100;

/** The module each vehicle type needs. */
export const VAN_MODULE = 'van_sale';
export const DELIVERY_MODULE = 'logistics';

/** What a selected module without a vehicle count says. */
export const VEHICLE_REQUIRED = {
  van_count: 'กรอกจำนวนรถเร่อย่างน้อย 1 คัน เพราะเลือก module Van Sale',
  delivery_count: 'กรอกจำนวนรถส่งอย่างน้อย 1 คัน เพราะเลือก module Logistics'
} as const;

/**
 * An optional number. Blank becomes 0, which is what the API stores for "not given", because its
 * columns and distributed_centers require a value. Anything else must really be a number.
 */
const blankAsZero = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? 0 : Number(value)),
    schema
  );

/** How many vehicles of one type to make. Blank means none. */
const vehicleCount = (label: string) =>
  blankAsZero(
    number(`${label}ต้องเป็นตัวเลข`)
      .int(`${label}ต้องเป็นจำนวนเต็ม`)
      .min(0, `${label}ต้องไม่ติดลบ`)
      .max(MAX_VEHICLES_PER_TYPE, `${label}ได้ไม่เกิน ${MAX_VEHICLES_PER_TYPE} คัน`)
  );

export const signupSchema = z
  .object({
    supplier_name: required('ชื่อ Tenant', 255),
    contact_phone: required('เบอร์โทร', 20).refine(validPhone, PHONE_RULE),
    contact_email: optional(255).refine(
      (value) => value === null || EMAIL_PATTERN.test(value),
      'อีเมลไม่ถูกต้อง เช่น name@example.com'
    ),
    order_prefix: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{2,4}$/, 'ใช้ตัวอักษรอังกฤษหรือตัวเลข 2–4 ตัว'),
    category: z.enum(
      SUPPLIER_CATEGORIES.map((category) => category.value) as [string, ...string[]],
      { error: 'เลือกประเภท Tenant' }
    ),
    province: required('จังหวัด', 100),
    district: required('อำเภอ', 100),
    sub_district: required('ตำบล', 100),
    zipcode: required('รหัสไปรษณีย์', 10).regex(/^[0-9]{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
    latitude: blankAsZero(
      number('ละติจูดต้องเป็นตัวเลข')
        .min(-90, 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90')
        .max(90, 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90')
    ),
    longitude: blankAsZero(
      number('ลองจิจูดต้องเป็นตัวเลข')
        .min(-180, 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180')
        .max(180, 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180')
    ),
    modules: z.array(z.string().min(1).max(64)).min(1, 'เลือกอย่างน้อย 1 module').max(32),
    has_erp: z.boolean(),
    erp_name: optional(100),
    source_supplier_id: optional(36),
    source_customer_id: optional(36),
    source_region: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
      z.number({ error: 'Region เดิมต้องเป็นตัวเลข' }).int('Region เดิมต้องเป็นจำนวนเต็ม').min(0).nullable()
    ),
    // Principals of the product master to start the products from. Optional.
    catalog_brands: z.array(z.string().trim().min(1).max(255)).max(200),
    // Both are optional: the API makes admin_{prefix} and a random password when they are null.
    admin_username: optional(80),
    // Not trimmed: a password means exactly what was typed.
    admin_password: z.preprocess(
      (value) => (value === null || value === undefined ? '' : value),
      z
        .string()
        .max(128, 'รหัสผ่านยาวได้ไม่เกิน 128 ตัว')
        .refine(
          (value) => value === '' || value.length >= 8,
          'รหัสผ่านต้องมีอย่างน้อย 8 ตัว หรือเว้นว่างให้ระบบสุ่ม'
        )
        .transform((value) => value || null)
    ),
    van_count: vehicleCount('จำนวนรถเร่'),
    delivery_count: vehicleCount('จำนวนรถส่ง')
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });

    if (value.has_erp && !value.erp_name) issue(['erp_name'], 'กรอกชื่อ ERP');

    if (value.admin_username && !USERNAME_PATTERN.test(value.admin_username)) {
      issue(['admin_username'], USERNAME_RULE);
    }

    if (value.latitude === 0 && value.longitude !== 0) {
      issue(['latitude'], 'กรอกละติจูดคู่กับลองจิจูด หรือเว้นว่างทั้งคู่');
    }
    if (value.longitude === 0 && value.latitude !== 0) {
      issue(['longitude'], 'กรอกลองจิจูดคู่กับละติจูด หรือเว้นว่างทั้งคู่');
    }

    if (value.source_supplier_id && !UUID_PATTERN.test(value.source_supplier_id)) {
      issue(['source_supplier_id'], UUID_RULE);
    }
    if (value.source_customer_id && !UUID_PATTERN.test(value.source_customer_id)) {
      issue(['source_customer_id'], UUID_RULE);
    }
    if (value.source_supplier_id && !value.source_customer_id) {
      issue(['source_customer_id'], 'ต้องกรอกคู่กับ Supplier เดิม');
    }
    if (value.source_customer_id && !value.source_supplier_id) {
      issue(['source_supplier_id'], 'ต้องกรอกคู่กับลูกค้าเดิม');
    }

    // The API refuses vehicles of a module the tenant does not get, so the form says it first.
    if (value.van_count > 0 && !value.modules.includes(VAN_MODULE)) {
      issue(['van_count'], 'เลือก module Van Sale ก่อน จึงจะสร้างรถเร่ได้');
    }
    if (value.delivery_count > 0 && !value.modules.includes(DELIVERY_MODULE)) {
      issue(['delivery_count'], 'เลือก module Logistics ก่อน จึงจะสร้างรถส่งได้');
    }
    // A selected module cannot work without a vehicle.
    if (value.modules.includes(VAN_MODULE) && value.van_count < 1) {
      issue(['van_count'], VEHICLE_REQUIRED.van_count);
    }
    if (value.modules.includes(DELIVERY_MODULE) && value.delivery_count < 1) {
      issue(['delivery_count'], VEHICLE_REQUIRED.delivery_count);
    }
  });

export type SignupPayload = z.output<typeof signupSchema>;

/** Field errors keyed by dotted path, such as admin_password. The first issue of a field wins. */
export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    errors[path] ??= issue.message;
  }
  return errors;
}
