import { isSignedOutError } from '@/features/auth/utils';

export type ApiErrorCode =
  | 'not_configured'
  | 'unreachable'
  | 'unauthorized'
  | 'not_found'
  | 'unexpected';

const PREFIX = 'provisioning_api:';

/** Server functions keep only an error's message, so the code travels inside it. */
export function apiError(code: ApiErrorCode) {
  return new Error(`${PREFIX}${code}`);
}

export function apiErrorCode(error: unknown): ApiErrorCode {
  const message = error instanceof Error ? error.message : '';
  return message.startsWith(PREFIX) ? (message.slice(PREFIX.length) as ApiErrorCode) : 'unexpected';
}

/** A failure that may clear by itself. A wrong setting or a missing request will fail the same way. */
export function isTransientError(error: unknown) {
  if (isSignedOutError(error)) return false;
  const code = apiErrorCode(error);
  return code === 'unreachable' || code === 'unexpected';
}

/**
 * Lets a read try once more, so one dropped connection does not put a warning on the screen.
 * Only in the browser: on the server it would hold the page for a second timeout when the API is
 * down. Writes must not use this, because the first attempt may have gone through.
 */
export function retryOnceIfTransient(failureCount: number, error: unknown) {
  return typeof document !== 'undefined' && failureCount < 1 && isTransientError(error);
}

export const API_ERROR_COPY: Record<ApiErrorCode, { title: string; body: string }> = {
  not_configured: {
    title: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ API',
    body: 'ตั้งค่า PROVISIONING_API_URL และ PROVISIONING_SERVICE_TOKEN บนเซิร์ฟเวอร์ของหน้านี้ แล้วเปิดใหม่'
  },
  unreachable: {
    title: 'เชื่อมต่อ provisioning API ไม่ได้',
    body: 'บริการอาจหยุดทำงาน ตรวจ /healthz ของ tenant-provisioning และค่า PROVISIONING_API_URL แล้วลองใหม่'
  },
  unauthorized: {
    title: 'API ไม่รับ token นี้',
    body: 'ค่า PROVISIONING_SERVICE_TOKEN ต้องตรงกับ SERVICE_TOKEN ของ tenant-provisioning'
  },
  not_found: {
    title: 'ไม่พบคำขอนี้',
    body: 'รหัสคำขออาจไม่ถูกต้อง กลับไปเลือกจากรายการคำขอ'
  },
  unexpected: {
    title: 'API ตอบกลับผิดปกติ',
    body: 'ดู log ของ tenant-provisioning แล้วลองใหม่อีกครั้ง'
  }
};
