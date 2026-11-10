import { describe, expect, test } from 'bun:test';
import type { ModuleOption, SurveyAnswer } from '../api/types';
import { displayStatus, isBeforeProvisioning, isFinalStatus, viewCount } from './status';
import { answerText, prefilledModules, requestTitle } from './survey';

const answer = (question_type: string, value: SurveyAnswer['value']): SurveyAnswer => ({
  question_id: 'q',
  question_name: 'คำถาม',
  question_type,
  value
});

const module = (code: string, extra: Partial<ModuleOption> = {}): ModuleOption => ({
  code,
  name: code,
  is_base: false,
  activation_phase: 'provisioning',
  ...extra
});

describe('requestTitle', () => {
  test('prefers the tenant name, then the contact', () => {
    expect(requestTitle({ supplier_name: 'ร้านเอ', contact_name: 'คุณบี' })).toBe('ร้านเอ');
    expect(requestTitle({ supplier_name: '', contact_name: 'คุณบี' })).toBe('คุณบี');
    expect(requestTitle({ supplier_name: '', survey: { contact_name: 'คุณซี' } })).toBe('คุณซี');
    expect(requestTitle({ supplier_name: '', contact_name: null })).toBe('ไม่ระบุชื่อ');
  });
});

const formatDate = () => 'วันที่แปลงแล้ว';

describe('answerText', () => {
  test('shows each answer type', () => {
    expect(answerText(answer('text', 'สวัสดี'), formatDate)).toBe('สวัสดี');
    expect(answerText(answer('multiple_choice', ['ก', 'ข']), formatDate)).toBe('ก, ข');
    expect(answerText(answer('text', null), formatDate)).toBe('');
  });

  test('formats a date and keeps text that is not one', () => {
    expect(answerText(answer('datetime', '2026-11-11T20:00:00+07:00'), formatDate)).toBe(
      'วันที่แปลงแล้ว'
    );
    expect(answerText(answer('datetime', 'พรุ่งนี้'), formatDate)).toBe('พรุ่งนี้');
  });

  // Form version 28 sends a typed choice as {"other": "..."}. It used to reach React as an object
  // and take the whole request page down.
  test('shows a typed choice alone and inside a list', () => {
    expect(answerText(answer('single_choice', { other: 'test' }), formatDate)).toBe('อื่นๆ: test');
    expect(
      answerText(
        answer('multiple_choice', ['thaibev', 'sermsuk', 'f&n', 'nestle', { other: 'test demo' }]),
        formatDate
      )
    ).toBe('thaibev, sermsuk, f&n, nestle, อื่นๆ: test demo');
    expect(answerText(answer('single_choice', { other: ' ' }), formatDate)).toBe('อื่นๆ');
  });

  test('never returns anything but a string', () => {
    const odd = [{ x: 1 }, 5, true, [['a']], { other: 7 }] as unknown as SurveyAnswer['value'][];
    for (const value of odd) {
      expect(typeof answerText(answer('single_choice', value), formatDate)).toBe('string');
    }
  });
});

describe('prefilledModules', () => {
  test('ticks only what can be chosen', () => {
    const options = [
      module('foundation', { is_base: true }),
      module('van_sale'),
      module('partner', { unavailable_reason: 'module_conflict' }),
      module('erp_integration', { activation_phase: 'erp_activation' })
    ];
    expect(
      prefilledModules(['foundation', 'van_sale', 'partner', 'erp_integration', 'gone'], options)
    ).toEqual(['van_sale', 'erp_integration']);
    expect(prefilledModules(null, options)).toEqual([]);
  });
});

describe('the approval statuses', () => {
  test('have their own label and never read as running', () => {
    expect(displayStatus({ status: 'awaiting_approval' })).toBe('awaiting');
    expect(displayStatus({ status: 'declined' })).toBe('declined');
    expect(isBeforeProvisioning('awaiting_approval')).toBe(true);
    expect(isBeforeProvisioning('pending')).toBe(false);
    expect(isFinalStatus('awaiting_approval')).toBe(true);
  });

  test('count in their own tab', () => {
    const counts = { awaiting_approval: 2, declined: 1, pending: 3 };
    expect(viewCount('approval', counts)).toBe(2);
    expect(viewCount('in_progress', counts)).toBe(3);
    expect(viewCount('all', counts)).toBe(6);
  });
});
