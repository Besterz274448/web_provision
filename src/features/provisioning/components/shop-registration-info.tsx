import type { ReactNode } from 'react';
import type { ShopAddress, ShopRegistrationInfo } from '../api/types';
import { formatDateTime } from '../lib/format';

const ADDRESS_TYPE: Record<string, string> = { shop: 'ที่อยู่ร้าน', individual: 'ที่อยู่ส่วนตัว' };
const LICENSE_TYPE: Record<string, string> = { liquor: 'ใบอนุญาตสุรา', tobacco: 'ใบอนุญาตยาสูบ' };

function Item({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5 border-t py-2 first:border-t-0 sm:nth-2:border-t-0'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className={`text-sm break-words ${mono ? 'font-mono text-xs' : ''}`}>
        {children ?? <span className='text-muted-foreground'>ไม่ได้ส่งมา</span>}
      </dd>
    </div>
  );
}

function addressText(a: ShopAddress) {
  return [a.name, a.sub_district, a.district, a.province, a.zipcode].filter(Boolean).join(' ');
}

/** What CCPlus sent, so the person approving reads it beside the request. */
export function ShopRegistrationDetails({ registration }: { registration: ShopRegistrationInfo }) {
  const p = registration.profile;
  const person = [p.name_prefix, p.first_name, p.last_name].filter(Boolean).join(' ') || null;
  return (
    <section aria-labelledby='shop-registration-title' className='flex flex-col gap-4'>
      <h2 id='shop-registration-title' className='font-semibold'>
        ข้อมูลจาก CCPlus
      </h2>
      <dl className='grid rounded-lg border px-4 py-1 sm:grid-cols-2 sm:gap-x-6'>
        <Item label='ชื่อร้าน'>{registration.shop_name}</Item>
        <Item label='อีเมลร้าน'>{registration.shop_email}</Item>
        <Item label='ประเภทผู้ประกอบการ'>{p.entity_type}</Item>
        <Item label='ชื่อเจ้าของ'>{person}</Item>
        <Item label='เลขบัตรประชาชน' mono>
          {p.personal_id}
        </Item>
        <Item label='วันเกิด'>{p.birth_date}</Item>
        <Item label='จดภาษีมูลค่าเพิ่ม'>{p.is_vat === null ? null : p.is_vat ? 'จด' : 'ไม่จด'}</Item>
        <Item label='เลขผู้เสียภาษี' mono>
          {p.tax_id}
        </Item>
        <Item label='ไฟล์บัตรประชาชน'>{p.id_card_document}</Item>
        <Item label='ไฟล์ ภ.พ.20'>{p.vat_registration_document}</Item>
      </dl>

      {registration.addresses.length > 0 && (
        <ul className='grid gap-3 sm:grid-cols-2'>
          {registration.addresses.map((a, index) => (
            <li key={index} className='rounded-lg border px-4 py-3 text-sm'>
              <p className='text-xs font-medium text-muted-foreground'>
                {ADDRESS_TYPE[a.address_type] ?? a.address_type}
              </p>
              <p className='mt-1 font-medium'>{a.company_name ?? '–'}</p>
              <p className='mt-0.5'>{addressText(a) || '–'}</p>
              <p className='mt-0.5 text-muted-foreground tabular-nums'>
                {a.phone_1 ?? 'ไม่มีเบอร์'}
                {a.latitude !== null && a.longitude !== null && ` · ${a.latitude}, ${a.longitude}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {registration.licenses.length > 0 && (
        <ul className='flex flex-wrap gap-2 text-sm'>
          {registration.licenses.map((l, index) => (
            <li key={index} className='rounded-md border px-3 py-1.5'>
              {LICENSE_TYPE[l.license_type] ?? l.license_type}
              <span className='text-muted-foreground'>
                {' '}
                · หมดอายุ {l.license_expiry_date ?? 'ไม่ระบุ'}
                {l.license_img && ` · ${l.license_img}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className='grid rounded-lg border px-4 py-1 sm:grid-cols-2 sm:gap-x-6'>
        <Item label='Supplier ที่ชวน (invited_by_supplier_id)' mono>
          {registration.invited_by_supplier_id}
        </Item>
        <Item label='Supplier (supplier_id)' mono>
          {registration.supplier_id}
        </Item>
        <Item label='Customer ID' mono>
          {registration.customer_id}
        </Item>
        <Item label='User ID' mono>
          {registration.user_id}
        </Item>
      </dl>
      <p className='text-xs text-muted-foreground'>
        ส่งเมื่อ <span className='tabular-nums'>{formatDateTime(registration.created_at)}</span>
        {registration.device_id && (
          <>
            {' '}
            · อุปกรณ์ <code className='font-mono'>{registration.device_id}</code>
          </>
        )}
      </p>
    </section>
  );
}
