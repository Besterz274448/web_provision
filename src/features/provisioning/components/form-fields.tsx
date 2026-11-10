import type { ChangeEvent, ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type InputFilter, filteredCaret } from '../lib/input-filters';

export const fieldId = (path: string) => `field-${path.replaceAll('.', '-')}`;

/** A label, its control, and the hint or error under it. An error replaces the hint. */
export function Field({
  path,
  label,
  optional,
  hint,
  error,
  className,
  children
}: {
  path: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={fieldId(path)}>
        {label}
        {optional && <span className='font-normal text-muted-foreground'>ไม่บังคับ</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${fieldId(path)}-message`} className='text-xs text-destructive'>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId(path)}-message`} className='text-xs text-muted-foreground'>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/**
 * The value of a change, with the characters the filter refuses dropped. The filtered value is
 * written back at once with the caret where the typing was. React then finds the input already
 * holding its value and leaves it alone, so the caret does not jump to the end, and the next
 * keystroke cannot land before the fix.
 */
export function filteredValue(
  event: ChangeEvent<HTMLInputElement>,
  filter?: InputFilter,
  maxLength?: number
) {
  const input = event.target;
  const raw = input.value;
  if (!filter) return raw;
  // The length is cut after filtering, not by the input's own maxLength, which would cut a pasted
  // "10 500" to "10 50" before the space is dropped.
  const value = filter(raw).slice(0, maxLength);
  if (value === raw) return value;
  // Email inputs have no caret position to read; theirs goes to the end.
  const caret = input.selectionStart;
  input.value = value;
  if (caret !== null) {
    const position = Math.min(filteredCaret(filter, raw, caret), value.length);
    input.setSelectionRange(position, position);
  }
  return value;
}

const controlProps = (path: string, error: string | undefined, hint: ReactNode) => ({
  id: fieldId(path),
  name: path,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error || hint ? `${fieldId(path)}-message` : undefined
});

type TextFieldProps = {
  path: string;
  label: string;
  value: string;
  error?: string;
  optional?: boolean;
  hint?: ReactNode;
  className?: string;
  /** Drops the characters this field cannot hold, as they are typed or pasted. */
  filter?: InputFilter;
  onValueChange: (value: string) => void;
} & Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'className' | 'name' | 'id'>;

export function TextField({
  path,
  label,
  value,
  error,
  optional,
  hint,
  className,
  filter,
  maxLength,
  onValueChange,
  ...input
}: TextFieldProps) {
  return (
    <Field
      path={path}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
    >
      <Input
        {...input}
        {...controlProps(path, error, hint)}
        // A filtered field cuts its own length, after the filter.
        maxLength={filter ? undefined : maxLength}
        value={value}
        onChange={(event) => onValueChange(filteredValue(event, filter, maxLength))}
      />
    </Field>
  );
}

export function SelectField({
  path,
  label,
  value,
  error,
  hint,
  placeholder,
  options,
  onValueChange
}: {
  path: string;
  label: string;
  value: string;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Field path={path} label={label} hint={hint} error={error}>
      <select
        {...controlProps(path, error, hint)}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          'dark:bg-input/30'
        )}
      >
        {placeholder !== undefined && <option value=''>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A native checkbox or radio with its label on the right and an optional note below. */
export function Choice({
  label,
  note,
  invalid,
  ...input
}: {
  label: ReactNode;
  note?: ReactNode;
  invalid?: boolean;
} & Omit<ComponentProps<'input'>, 'aria-invalid'>) {
  return (
    <label
      className={cn(
        'flex items-start gap-2 text-sm',
        input.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <input
        {...input}
        aria-invalid={invalid ? true : undefined}
        className='mt-0.5 size-4 shrink-0 accent-primary disabled:opacity-50'
      />
      <span className='min-w-0'>
        <span className={input.disabled ? 'text-muted-foreground' : undefined}>{label}</span>
        {note && <span className='mt-0.5 block text-xs text-muted-foreground'>{note}</span>}
      </span>
    </label>
  );
}

/** One group of the form: what it is on the left, its fields on the right. */
export function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className='grid gap-x-8 gap-y-4 border-t py-6 first:border-t-0 first:pt-0 lg:grid-cols-[15rem_minmax(0,1fr)]'>
      <div>
        <h2 className='font-semibold'>{title}</h2>
        {description && <p className='mt-1 text-sm text-muted-foreground'>{description}</p>}
      </div>
      <div className='flex min-w-0 flex-col gap-4'>{children}</div>
    </section>
  );
}
