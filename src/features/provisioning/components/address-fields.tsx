import { Combobox } from '@base-ui/react/combobox';
import { IconCheck, IconChevronDown, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  districtsQueryOptions,
  provincesQueryOptions,
  subDistrictsQueryOptions
} from '../api/queries';
import { type AddressItem, findByName, matchesQuery } from '../lib/address';
import { digitsOnly } from '../lib/input-filters';
import { Field, TextField, fieldId } from './form-fields';

type Item = AddressItem & { id: number | string };

/** A text box that suggests items of a list as someone types, and only takes an item of the list. */
function ComboboxField<T extends Item>({
  path,
  label,
  items,
  selected,
  placeholder,
  empty,
  disabled,
  hint,
  error,
  detail,
  onSelect
}: {
  path: string;
  label: string;
  items: readonly T[];
  selected: T | null;
  placeholder: string;
  empty: string;
  disabled?: boolean;
  hint?: ReactNode;
  error?: string;
  /** Shown at the right of each item, such as its zip code. */
  detail?: (item: T) => string | undefined;
  onSelect: (item: T | null) => void;
}) {
  const id = fieldId(path);
  return (
    <Field path={path} label={label} hint={hint} error={error}>
      <Combobox.Root
        items={items as T[]}
        value={selected}
        onValueChange={(item) => onSelect(item)}
        itemToStringLabel={(item: T) => item.name_th}
        isItemEqualToValue={(a: T, b: T) => a.id === b.id}
        filter={(item: T, query) => matchesQuery(item, query)}
        disabled={disabled}
        autoHighlight
      >
        <Combobox.InputGroup className='relative'>
          <Combobox.Input
            id={id}
            name={path}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-message` : undefined}
            className={cn(
              'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pr-14 pl-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground md:text-sm',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
              'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
              'dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'
            )}
          />
          <div className='absolute inset-y-0 right-1 flex items-center text-muted-foreground'>
            {selected && !disabled && (
              <Combobox.Clear
                aria-label={`ล้าง${label}`}
                className='flex size-6 items-center justify-center rounded-md hover:text-foreground'
              >
                <IconX className='size-3.5' aria-hidden='true' />
              </Combobox.Clear>
            )}
            <Combobox.Trigger
              aria-label={`เปิดรายการ${label}`}
              className='flex size-6 items-center justify-center rounded-md hover:text-foreground disabled:pointer-events-none'
            >
              <IconChevronDown className='size-4' aria-hidden='true' />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className='isolate z-50'>
            <Combobox.Popup
              className={cn(
                'w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
                'duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95'
              )}
            >
              <Combobox.Empty className='px-2.5 py-3 text-sm text-muted-foreground empty:hidden'>
                {empty}
              </Combobox.Empty>
              <Combobox.List className='max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0'>
                {(item: T) => (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className='relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground'
                  >
                    <span className='min-w-0 flex-1 truncate'>{item.name_th}</span>
                    {detail?.(item) && (
                      <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                        {detail(item)}
                      </span>
                    )}
                    <Combobox.ItemIndicator className='absolute right-2 flex size-4 items-center justify-center'>
                      <IconCheck className='size-4' aria-hidden='true' />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Field>
  );
}

export type AddressValue = {
  province: string;
  district: string;
  sub_district: string;
  zipcode: string;
};

const FREE_TEXT_HINT = 'โหลดรายชื่อไม่ได้ พิมพ์เอง';

const loading = (query: { isPending: boolean; fetchStatus: string }) =>
  query.isPending && query.fetchStatus === 'fetching';

/**
 * Province, district, sub-district and zip code. Each list comes from the address master once the
 * level above is chosen, and choosing a sub-district fills in its zip code. The form keeps the Thai
 * names, so a stored name is matched back to its item. When a list cannot be read, or a locked
 * province from the survey is not in the master, the levels below fall back to plain text.
 */
export function AddressFields({
  value,
  errors,
  lockedProvince,
  lockedFrom = 'แบบสำรวจ',
  onChange
}: {
  value: AddressValue;
  errors: Record<string, string>;
  lockedProvince: boolean;
  /** Where a locked province came from, for its hint. */
  lockedFrom?: string;
  onChange: (patch: Partial<AddressValue>) => void;
}) {
  const provinces = useQuery(provincesQueryOptions());
  const province = findByName(provinces.data?.provinces, value.province);

  const districts = useQuery({
    ...districtsQueryOptions(province?.id ?? 0),
    enabled: province !== undefined
  });
  const district = findByName(districts.data?.districts, value.district);

  const subDistricts = useQuery({
    ...subDistrictsQueryOptions(district?.id ?? 0),
    enabled: district !== undefined
  });
  const subDistrict =
    subDistricts.data?.sub_districts.find(
      (item) => item.name_th === value.sub_district && item.zip_code === value.zipcode
    ) ?? findByName(subDistricts.data?.sub_districts, value.sub_district);

  // A list that failed, or a locked province the master does not know, leaves typing as the way in.
  const provinceFree = provinces.isError;
  const unknownLocked = lockedProvince && provinces.isSuccess && !province;
  const districtFree = provinceFree || unknownLocked || districts.isError;
  const subDistrictFree = districtFree || subDistricts.isError;

  const text = (key: keyof AddressValue) => ({
    path: key,
    value: value[key],
    error: errors[key],
    onValueChange: (next: string) => onChange({ [key]: next })
  });

  return (
    <>
      {lockedProvince || provinceFree ? (
        <TextField
          {...text('province')}
          label='จังหวัด'
          maxLength={100}
          disabled={lockedProvince}
          hint={
            lockedProvince
              ? unknownLocked
                ? `จาก${lockedFrom} แก้ไม่ได้ ไม่พบชื่อนี้ในรายชื่อจังหวัด จึงพิมพ์อำเภอและตำบลเอง`
                : `จาก${lockedFrom} แก้ไม่ได้`
              : FREE_TEXT_HINT
          }
        />
      ) : (
        <ComboboxField
          path='province'
          label='จังหวัด'
          items={provinces.data?.provinces ?? []}
          selected={province ?? null}
          placeholder={loading(provinces) ? 'กำลังโหลด…' : 'พิมพ์เพื่อค้นหาจังหวัด'}
          empty='ไม่พบจังหวัดนี้'
          disabled={!provinces.data}
          error={errors.province}
          onSelect={(item) =>
            onChange({ province: item?.name_th ?? '', district: '', sub_district: '', zipcode: '' })
          }
        />
      )}

      {districtFree ? (
        <TextField
          {...text('district')}
          label='อำเภอ / เขต'
          maxLength={100}
          hint={unknownLocked ? undefined : FREE_TEXT_HINT}
        />
      ) : (
        <ComboboxField
          path='district'
          label='อำเภอ / เขต'
          items={districts.data?.districts ?? []}
          selected={district ?? null}
          placeholder={
            !province ? 'เลือกจังหวัดก่อน' : loading(districts) ? 'กำลังโหลด…' : 'พิมพ์เพื่อค้นหาอำเภอ'
          }
          empty='ไม่พบอำเภอนี้ในจังหวัดที่เลือก'
          disabled={!districts.data}
          error={errors.district}
          onSelect={(item) =>
            onChange({ district: item?.name_th ?? '', sub_district: '', zipcode: '' })
          }
        />
      )}

      {subDistrictFree ? (
        <TextField
          {...text('sub_district')}
          label='ตำบล / แขวง'
          maxLength={100}
          hint={districtFree ? undefined : FREE_TEXT_HINT}
        />
      ) : (
        <ComboboxField
          path='sub_district'
          label='ตำบล / แขวง'
          items={subDistricts.data?.sub_districts ?? []}
          selected={subDistrict ?? null}
          placeholder={
            !district
              ? 'เลือกอำเภอก่อน'
              : loading(subDistricts)
                ? 'กำลังโหลด…'
                : 'พิมพ์ชื่อตำบลหรือรหัสไปรษณีย์'
          }
          empty='ไม่พบตำบลนี้ในอำเภอที่เลือก'
          disabled={!subDistricts.data}
          error={errors.sub_district}
          detail={(item) => item.zip_code}
          onSelect={(item) =>
            onChange({ sub_district: item?.name_th ?? '', zipcode: item?.zip_code ?? '' })
          }
        />
      )}

      <TextField
        {...text('zipcode')}
        label='รหัสไปรษณีย์'
        inputMode='numeric'
        maxLength={5}
        filter={digitsOnly}
        hint={subDistrictFree ? undefined : 'ใส่ให้เมื่อเลือกตำบล แก้ได้ถ้าไม่ตรง'}
      />
    </>
  );
}
