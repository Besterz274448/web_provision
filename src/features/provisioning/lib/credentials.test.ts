import { describe, expect, test } from 'bun:test';
import { credentialsText, NO_PASSWORD_TEXT } from './credentials';

describe('credentialsText', () => {
  test('lists every login under the supplier name', () => {
    const text = credentialsText('ร้านทดสอบ', [
      { type: 'ผู้ดูแลระบบ', name: 'บัญชีหลัก', username: 'admin_a', password: 'secret-1' },
      { type: 'รถเร่', name: 'รถ 1', username: 'van01_a', password: 'secret-2' }
    ]);
    expect(text).toBe(
      [
        'ข้อมูลเข้าระบบ ร้านทดสอบ',
        'ผู้ดูแลระบบ: บัญชีหลัก\nUsername: admin_a\nPassword: secret-1',
        'รถเร่: รถ 1\nUsername: van01_a\nPassword: secret-2'
      ].join('\n\n')
    );
  });

  test('says so when a login has no stored password', () => {
    const text = credentialsText('ร้านทดสอบ', [
      { type: 'ผู้ดูแลระบบ', name: 'บัญชีหลัก', username: 'admin_a', password: '' }
    ]);
    expect(text).toContain(`Password: ${NO_PASSWORD_TEXT}`);
  });
});
