import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogOptionsQueryOptions } from '../api/queries';
import { toggleBrand } from '../lib/catalog-selection';
import { ApiErrorPanel } from './api-error';
import { Choice } from './form-fields';

/**
 * The brands (principals) of the product master. A failed list only shows here, because choosing
 * products is optional and must not stop someone from sending the rest of the form.
 */
export function CatalogPicker({
  brands,
  onChange
}: {
  brands: string[];
  onChange: (next: string[]) => void;
}) {
  const options = useQuery(catalogOptionsQueryOptions());

  if (options.isPending) {
    return (
      <div className='grid gap-3 sm:grid-cols-2' aria-hidden='true'>
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-6 w-full' />
      </div>
    );
  }
  if (!options.data) {
    return (
      <ApiErrorPanel
        error={options.error}
        onRetry={() => void options.refetch()}
        retrying={options.isFetching}
      />
    );
  }
  // A brand ticked from the survey that the master no longer has is still shown, so it can be unticked.
  const offered = options.data.brands.map((brand) => brand.name);
  const missing = brands.filter((name) => !offered.includes(name));
  if (offered.length === 0 && missing.length === 0) {
    return <p className='text-sm text-muted-foreground'>ยังไม่มีสินค้าที่มีราคาใน product master ให้เลือก</p>;
  }

  return (
    <fieldset className='grid gap-2 sm:grid-cols-2'>
      <legend className='sr-only'>เลือกแบรนด์</legend>
      {options.data.brands.map((brand) => (
        <Choice
          key={brand.name}
          type='checkbox'
          label={brand.name}
          note={`${brand.sku_count.toLocaleString('th-TH')} สินค้า`}
          checked={brands.includes(brand.name)}
          onChange={(event) => onChange(toggleBrand(brands, brand.name, event.target.checked))}
        />
      ))}
      {missing.map((name) => (
        <Choice
          key={name}
          type='checkbox'
          label={name}
          note='ไม่มีใน product master ตอนนี้ จะไม่ได้สินค้า'
          checked
          onChange={() => onChange(toggleBrand(brands, name, false))}
        />
      ))}
    </fieldset>
  );
}
