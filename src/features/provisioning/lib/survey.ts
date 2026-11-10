import type { ModuleOption, SurveyAnswer } from '../api/types';

// The list has the contact on the row, and a single request has it under survey.
type Named = {
  supplier_name: string;
  contact_name?: string | null;
  survey?: { contact_name: string | null } | null;
};

/** A request from the survey has no tenant name until it is approved, so it goes by its contact. */
export function requestTitle(request: Named) {
  return request.supplier_name || request.contact_name || request.survey?.contact_name || 'ไม่ระบุชื่อ';
}

/**
 * One choice as text. A typed choice comes as {"other": "..."}. The survey owns this format, so
 * any other shape is shown as its JSON rather than breaking the page.
 */
function choiceText(choice: unknown): string {
  if (choice === null || choice === undefined) return '';
  if (typeof choice === 'string') return choice;
  if (typeof choice === 'object' && !Array.isArray(choice) && 'other' in choice) {
    const other = (choice as { other: unknown }).other;
    const typed = typeof other === 'string' ? other.trim() : JSON.stringify(other);
    return typed ? `อื่นๆ: ${typed}` : 'อื่นๆ';
  }
  return typeof choice === 'object' ? JSON.stringify(choice) : String(choice);
}

/** One answer as text. An empty string means the question was left blank. */
export function answerText(
  { question_type, value }: SurveyAnswer,
  formatDate: (iso: string) => string
) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(choiceText).filter(Boolean).join(', ');
  // Text the survey sent as a date that is not one stays as it was sent.
  if (question_type === 'datetime' && typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return formatDate(value);
  }
  return choiceText(value);
}

/**
 * What the approval form starts with. Only modules someone can actually choose are ticked: the
 * customer may have shown interest in one that cannot be opened yet, and a ticked one that is
 * disabled would make the API refuse the approval with no way to untick it.
 */
export function prefilledModules(modules: string[] | null, options: ModuleOption[]) {
  return (modules ?? []).filter((code) =>
    options.some((option) => option.code === code && !option.is_base && !option.unavailable_reason)
  );
}
