import { describe, expect, test } from 'bun:test';
import { countVehicles, progressSummary, tenantStages, vehicleStageState } from './progress';
import type { ProgressInput } from './progress';

const base: ProgressInput = {
  status: 'pending',
  current_step: null,
  last_error_code: null,
  tenant_completed_at: null,
  flow_api_completed_at: null,
  auth_completed_at: null,
  catalog_status: 'not_requested',
  vehicles: { total: 0, completed: 0, failed: 0, active: 0 }
};

const at = '2026-11-03T00:00:00Z';
const states = (r: ProgressInput) => tenantStages(r).map((stage) => stage.state);

describe('tenantStages', () => {
  test('a new request has not started', () => {
    expect(states(base)).toEqual(['idle', 'idle', 'idle']);
    expect(progressSummary(base)).toBe('ยังไม่เริ่ม');
  });

  test('checking with flow-auth is the first stage', () => {
    const r: ProgressInput = { ...base, status: 'processing', current_step: 'validate_flow_auth' };
    expect(states(r)).toEqual(['active', 'idle', 'idle']);
    expect(progressSummary(r)).toBe('กำลังทำ ตรวจข้อมูล');
  });

  test('waiting for flow-api keeps its stage active', () => {
    const r: ProgressInput = { ...base, status: 'handed_off', current_step: 'handoff_flow_api' };
    expect(states(r)).toEqual(['done', 'active', 'idle']);
    expect(progressSummary(r)).toBe('กำลังทำ สร้าง Tenant');
  });

  test('a silent flow-api fails its stage, even after current_step is cleared', () => {
    const r: ProgressInput = { ...base, status: 'stalled', last_error_code: 'callback_timeout' };
    expect(states(r)).toEqual(['done', 'failed', 'idle']);
    expect(progressSummary(r)).toBe('ล้มที่ สร้าง Tenant');
  });

  test('a callback failure waiting for backoff is a retry at flow-api', () => {
    const r: ProgressInput = { ...base, last_error_code: 'db_lock' };
    expect(states(r)).toEqual(['done', 'retry', 'idle']);
    expect(progressSummary(r)).toBe('รอลองใหม่ที่ สร้าง Tenant');
  });

  test('a callback rejection points at flow-api', () => {
    const r: ProgressInput = { ...base, status: 'rejected', last_error_code: 'missing_reference' };
    expect(states(r)).toEqual(['done', 'failed', 'idle']);
  });

  test('a duplicate found while checking stays on the first stage', () => {
    const r: ProgressInput = {
      ...base,
      status: 'rejected',
      current_step: 'validate_flow_auth',
      last_error_code: 'duplicate_order_prefix'
    };
    expect(states(r)).toEqual(['failed', 'idle', 'idle']);
    expect(progressSummary(r)).toBe('ล้มที่ ตรวจข้อมูล');
  });

  test('bad input rejected before any step counts against the first stage', () => {
    const r: ProgressInput = { ...base, status: 'rejected', last_error_code: 'invalid_input' };
    expect(states(r)).toEqual(['failed', 'idle', 'idle']);
  });

  test('after flow-api finishes, flow-auth is still to come', () => {
    const r: ProgressInput = { ...base, tenant_completed_at: at, flow_api_completed_at: at };
    expect(states(r)).toEqual(['done', 'done', 'idle']);
    expect(progressSummary(r)).toBe('รอทำต่อที่ สร้าง Login');
  });

  test('a flow-auth failure points at the last stage', () => {
    const r: ProgressInput = {
      ...base,
      status: 'failed',
      flow_api_completed_at: at,
      tenant_completed_at: at,
      current_step: 'write_flow_auth',
      last_error_code: 'internal_error'
    };
    expect(states(r)).toEqual(['done', 'done', 'failed']);
    expect(progressSummary(r)).toBe('ล้มที่ สร้าง Login');
  });

  test('a retry of a partly finished request runs from flow-api again', () => {
    const r: ProgressInput = {
      ...base,
      status: 'handed_off',
      tenant_completed_at: at,
      auth_completed_at: at,
      current_step: 'handoff_flow_api'
    };
    expect(states(r)).toEqual(['done', 'active', 'idle']);
    expect(progressSummary(r)).toBe('กำลังทำ สร้าง Tenant');
  });

  test('a retry after reset keeps earlier steps done but does not claim the failed one', () => {
    const r: ProgressInput = { ...base, current_step: 'handoff_flow_api' };
    expect(states(r)).toEqual(['done', 'idle', 'idle']);
    expect(progressSummary(r)).toBe('รอทำต่อที่ สร้าง Tenant');
  });
});

describe('vehicle stage', () => {
  const finished: ProgressInput = {
    ...base,
    status: 'completed',
    tenant_completed_at: at,
    flow_api_completed_at: at,
    auth_completed_at: at
  };

  test('stays idle while flow-api has not reported', () => {
    const r: ProgressInput = {
      ...base,
      status: 'handed_off',
      vehicles: { total: 2, completed: 0, failed: 0, active: 0 }
    };
    expect(vehicleStageState(r)).toBe('idle');
  });

  test('one failed vehicle fails the stage while the tenant stays done', () => {
    const r: ProgressInput = {
      ...finished,
      status: 'completed_with_errors',
      vehicles: { total: 4, completed: 3, failed: 1, active: 0 }
    };
    expect(states(r)).toEqual(['done', 'done', 'done']);
    expect(vehicleStageState(r)).toBe('failed');
    expect(progressSummary(r)).toBe('รถ 3/4 · ล้ม 1');
  });

  test('a vehicle rejected before handoff shows at once', () => {
    const r: ProgressInput = {
      ...base,
      status: 'handed_off',
      vehicles: { total: 2, completed: 0, failed: 1, active: 0 }
    };
    expect(vehicleStageState(r)).toBe('failed');
  });

  test('a finished request without vehicles is done', () => {
    expect(vehicleStageState(finished)).toBe('done');
    expect(progressSummary(finished)).toBe('เสร็จ ไม่มีรถ');
  });

  test('vehicles finish with the callback, before flow-auth', () => {
    const r: ProgressInput = {
      ...base,
      flow_api_completed_at: at,
      tenant_completed_at: at,
      vehicles: { total: 2, completed: 2, failed: 0, active: 0 }
    };
    expect(vehicleStageState(r)).toBe('done');
    expect(progressSummary(r)).toBe('รอทำต่อที่ สร้าง Login');
  });

  test('a failed catalog is part of the summary', () => {
    const r: ProgressInput = {
      ...finished,
      status: 'completed_with_errors',
      catalog_status: 'failed',
      vehicles: { total: 2, completed: 2, failed: 0, active: 0 }
    };
    expect(progressSummary(r)).toBe('รถ 2/2 · สินค้าล้ม');
  });
});

test('countVehicles counts rejected vehicles as failed', () => {
  const vehicle = { id: '1', vehicle_type: 'van', is_trial: false, van_code: 'A' } as const;
  expect(
    countVehicles([
      { ...vehicle, status: 'completed' },
      { ...vehicle, status: 'rejected' },
      { ...vehicle, status: 'failed' },
      { ...vehicle, status: 'processing' },
      { ...vehicle, status: 'pending' }
    ])
  ).toEqual({ total: 5, completed: 1, failed: 2, active: 1 });
});
