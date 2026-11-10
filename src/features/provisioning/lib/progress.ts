import type { CatalogStatus, RequestStatus, Vehicle, VehicleCounts } from '../api/types';

export type StageState = 'done' | 'active' | 'retry' | 'failed' | 'idle';

export type Stage = { key: string; label: string; state: StageState };

/**
 * The order Provision moves a tenant in. flow-api writes the tenant and its vehicles, and reports
 * back by callback. flow-auth is last, because a login works as soon as it exists there.
 */
const TENANT_STEPS = [
  { key: 'validate_flow_auth', label: 'ตรวจข้อมูล' },
  { key: 'handoff_flow_api', label: 'สร้าง Tenant' },
  { key: 'write_flow_auth', label: 'สร้าง Login' }
];

const VALIDATE = 0;
const FLOW_API = 1;
const FLOW_AUTH = 2;

// These fail before the first step starts. Any other error without a current step came from
// flow-api's callback, which clears current_step.
const BEFORE_FIRST_STEP_ERRORS = new Set([
  'invalid_input',
  'module_conflict',
  'module_not_available',
  'entitlement_invalid'
]);

export type ProgressInput = {
  status: RequestStatus;
  current_step: string | null;
  last_error_code: string | null;
  tenant_completed_at: string | null;
  flow_api_completed_at: string | null;
  auth_completed_at: string | null;
  catalog_status: CatalogStatus;
  vehicles: VehicleCounts;
};

function stoppedState(r: ProgressInput): StageState {
  if (r.status === 'failed' || r.status === 'rejected' || r.status === 'stalled') return 'failed';
  if (r.status === 'processing' || r.status === 'handed_off') return 'active';
  return r.last_error_code ? 'retry' : 'idle';
}

// By status, not by auth_completed_at: a retry of a partly finished request keeps that time while
// it runs again.
function finished(r: ProgressInput) {
  return r.status === 'completed' || r.status === 'completed_with_errors';
}

function reachedStage(r: ProgressInput) {
  if (r.flow_api_completed_at) return FLOW_AUTH;
  if (r.status === 'handed_off' || r.status === 'stalled') return FLOW_API;
  const step = TENANT_STEPS.findIndex(({ key }) => key === r.current_step);
  if (step >= 0) return step;
  if (r.last_error_code && !BEFORE_FIRST_STEP_ERRORS.has(r.last_error_code)) return FLOW_API;
  return VALIDATE;
}

export function tenantStages(r: ProgressInput): Stage[] {
  if (finished(r)) return TENANT_STEPS.map((step) => ({ ...step, state: 'done' }));
  const at = reachedStage(r);
  const atState = stoppedState(r);
  return TENANT_STEPS.map((step, index) => ({
    ...step,
    state: index < at ? 'done' : index === at ? atState : 'idle'
  }));
}

/** flow-api reports its vehicles in the same callback that ends its stage. */
export function vehicleStageState(r: ProgressInput): StageState {
  const { total, completed, failed, active } = r.vehicles;
  if (failed > 0) return 'failed';
  if (total > 0 && completed === total) return 'done';
  if (total === 0 && finished(r)) return 'done';
  if (active > 0) return 'active';
  return 'idle';
}

const STAGE_VERB: Record<'done' | 'active' | 'retry' | 'failed', string> = {
  done: 'เสร็จ',
  active: 'กำลังทำ',
  retry: 'รอลองใหม่ที่',
  failed: 'ล้มที่'
};

/** One short phrase that says where the request is, for reading without the coloured track. */
export function progressSummary(r: ProgressInput): string {
  const stages = tenantStages(r);
  const stopped = stages.find((stage) => stage.state !== 'done');
  if (stopped) {
    if (stopped.state !== 'idle') return `${STAGE_VERB[stopped.state]} ${stopped.label}`;
    // Idle after earlier stages are done means the next step is waiting for a worker.
    return stopped === stages[VALIDATE] ? 'ยังไม่เริ่ม' : `รอทำต่อที่ ${stopped.label}`;
  }
  const { total, completed, failed } = r.vehicles;
  const parts = [total === 0 ? 'เสร็จ ไม่มีรถ' : `รถ ${completed}/${total}`];
  if (failed > 0) parts.push(`ล้ม ${failed}`);
  if (r.catalog_status === 'failed') parts.push('สินค้าล้ม');
  return parts.join(' · ');
}

export function countVehicles(vehicles: Vehicle[]): VehicleCounts {
  return {
    total: vehicles.length,
    completed: vehicles.filter((v) => v.status === 'completed').length,
    failed: vehicles.filter((v) => v.status === 'failed' || v.status === 'rejected').length,
    active: vehicles.filter((v) => v.status === 'processing').length
  };
}
