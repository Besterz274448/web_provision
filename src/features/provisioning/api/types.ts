export const REQUEST_STATUSES = [
  'pending',
  'processing',
  'completed',
  'completed_with_errors',
  'rejected',
  'failed',
  'handed_off',
  'stalled',
  'awaiting_approval',
  'declined'
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type CatalogStatus = 'not_requested' | 'pending' | 'completed' | 'empty' | 'failed';

export type VehicleCounts = {
  total: number;
  completed: number;
  failed: number;
  active: number;
};

/** The channel a request came from. Another channel may be added, so any string can arrive. */
export type RequestSource = 'console' | 'survey' | 'ccplus' | (string & {});

export type RequestSummary = {
  id: string;
  status: RequestStatus;
  source: RequestSource;
  supplier_name: string;
  order_prefix: string;
  province: string;
  attempt_count: number;
  current_step: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  next_attempt_at: string | null;
  requested_at: string;
  tenant_completed_at: string | null;
  completed_at: string | null;
  flow_api_completed_at: string | null;
  auth_completed_at: string | null;
  catalog_status: CatalogStatus;
  vehicles: VehicleCounts;
  from_survey: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  demo_at: string | null;
  /** The survey's องค์กรที่สังกัด is ThaiBev. Such a request is declined on arrival. */
  thaibev_staff: boolean;
};

export type RequestListResponse = {
  items: RequestSummary[];
  total: number;
  page: number;
  limit: number;
  counts: Partial<Record<RequestStatus, number>>;
};

export type RequestListFilters = {
  page: number;
  limit: number;
  q?: string;
  status?: string;
};

export type Vehicle = {
  id: string;
  vehicle_type: 'van' | 'delivery';
  is_trial: boolean;
  van_code: string;
  status: RequestStatus;
  full_username?: string;
  last_error_code?: string;
  last_error_message?: string;
  completed_at?: string;
};

export type RequestDetail = {
  id: string;
  status: RequestStatus;
  source: RequestSource;
  supplier_id: string | null;
  supplier_name: string;
  order_prefix: string;
  province: string;
  district: string;
  sub_district: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  category: string;
  contact_phone: string | null;
  contact_email: string | null;
  modules: string[] | null;
  has_erp: boolean;
  erp_name: string | null;
  erp_activation_status: string;
  attempt_count: number;
  current_step: string | null;
  trigger_source: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  next_attempt_at: string | null;
  requested_at: string;
  started_at: string | null;
  tenant_completed_at: string | null;
  completed_at: string | null;
  flow_api_completed_at: string | null;
  auth_completed_at: string | null;
  source_supplier_id: string | null;
  source_customer_id: string | null;
  /** CCPlus user_id and invited_by_supplier_id. Empty for other channels. */
  source_user_id: string | null;
  invited_by_supplier_id: string | null;
  /** The tenant takes supplier_id and its admin user from a complete CCPlus registration. */
  ccplus_identity: boolean;
  catalog_brands: string[] | null;
  catalog_status: CatalogStatus;
  catalog_found: number | null;
  catalog_inserted: number | null;
  catalog_skipped: Record<string, number> | null;
  catalog_error_code: string | null;
  catalog_error_message: string | null;
  trace_id: string | null;
  /** False when a retry would reach flow-api without the admin password, which a rejection or retention removed. */
  can_retry: boolean;
  vehicles: Vehicle[];
  survey: SurveyInfo | null;
  shop_registration: ShopRegistrationInfo | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decline_reason: string | null;
};

/** One question as the survey sent it. The value is a string, a list or nothing, by question type. */
/** A choice the customer typed instead of picking one, alone or inside a list. */
export type SurveyOtherChoice = { other: string };
export type SurveyChoice = string | SurveyOtherChoice;

export type SurveyAnswer = {
  question_id: string;
  question_name: string;
  question_type: string;
  value: SurveyChoice | SurveyChoice[] | null;
};

export type SurveyInfo = {
  survey_id: string;
  version: number;
  submitted_at: string;
  line_sub_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  demo_at: string | null;
  sales_contact: string | null;
  /** The survey's องค์กรที่สังกัด is ThaiBev. Such a request is declined on arrival. */
  thaibev_staff: boolean;
  answers: SurveyAnswer[];
};

/** What CCPlus sent for a request from POST /shop-registrations. */
export type ShopRegistrationInfo = {
  id: string;
  created_at: string;
  invited_by_supplier_id: string | null;
  supplier_id: string | null;
  customer_id: string | null;
  user_id: string | null;
  device_id: string | null;
  shop_name: string;
  shop_email: string | null;
  profile: {
    entity_type: string | null;
    name_prefix: string | null;
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
    id_card_document: string | null;
    personal_id: string | null;
    is_vat: boolean | null;
    tax_id: string | null;
    vat_registration_document: string | null;
  };
  addresses: ShopAddress[];
  licenses: ShopLicense[];
};

export type ShopAddress = {
  address_type: string;
  company_name: string | null;
  phone_1: string | null;
  name: string | null;
  province: string | null;
  district: string | null;
  sub_district: string | null;
  zipcode: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ShopLicense = {
  license_type: string;
  license_img: string | null;
  license_expiry_date: string | null;
};

/** A brand (principal) of the product master, and how many products with a price it has. */
export type CatalogBrand = { name: string; sku_count: number };

/** Rows of the Thai address master. A request stores the Thai names, not these ids. */
export type Province = { id: number; name_th: string; name_en: string };
export type District = { id: number; name_th: string; name_en: string };
export type SubDistrict = { id: string; name_th: string; name_en: string; zip_code: string };

export type ModuleOption = {
  code: string;
  name: string;
  is_base: boolean;
  activation_phase: string;
  unavailable_reason?: string;
};

/** taken: a tenant has the prefix. requested: another request is about to make one with it. */
export type OrderPrefixCheck = {
  order_prefix: string;
  available: boolean;
  reason: '' | 'taken' | 'requested';
};

export type CreateRequestResult = { id: string; error?: never } | { id?: never; error: string };

export type RetryRequestResult = { ok: true; error?: never } | { ok?: never; error: string };

/** One login to hand to the customer. password is empty when none is stored for it any more. */
export type Credential = {
  type: string;
  name: string;
  username: string;
  password: string;
};

export type RevealCredentialsResult =
  | { credentials: Credential[]; error?: never }
  | { credentials?: never; error: 'not_finished' | 'expired' };

export type StepStatus = 'executed' | 'succeeded' | 'skipped' | 'failed' | 'rolled_back';

export type StepLog = {
  id: number;
  vehicle_request_id: string | null;
  attempt: number;
  step: string;
  target_db: string | null;
  status: StepStatus;
  rows_affected: number | null;
  started_at: string;
  duration_ms: number;
  error_code: string | null;
  error_message: string | null;
};
