import type { Credential } from '../api/types';

export const NO_PASSWORD_TEXT = 'ไม่มีรหัสเก็บไว้แล้ว';

/** Every login as plain text, for the team to paste into a message to the customer. */
export function credentialsText(supplierName: string, credentials: Credential[]) {
  const logins = credentials.map((login) =>
    [
      `${login.type}: ${login.name}`,
      `Username: ${login.username}`,
      `Password: ${login.password || NO_PASSWORD_TEXT}`
    ].join('\n')
  );
  return [`ข้อมูลเข้าระบบ ${supplierName}`, ...logins].join('\n\n');
}
