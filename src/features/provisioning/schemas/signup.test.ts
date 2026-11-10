import { describe, expect, test } from 'bun:test';
import { fieldErrors, signupSchema } from './signup';

const form = {
  supplier_name: ' ร้านทดสอบ ',
  contact_phone: ' 081-234-5678 ',
  contact_email: '',
  order_prefix: 'TN01',
  category: 'agent',
  province: 'กรุงเทพมหานคร',
  district: 'บางรัก',
  sub_district: 'สีลม',
  zipcode: '10500',
  latitude: '13.7248',
  longitude: '100.534',
  modules: ['van_sale'],
  has_erp: false,
  erp_name: '',
  source_supplier_id: '',
  source_customer_id: '',
  source_region: '',
  catalog_brands: [] as string[],
  admin_username: '',
  admin_password: '',
  van_count: '3',
  delivery_count: ''
};

const errorsOf = (input: unknown) => {
  const result = signupSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
};

describe('signupSchema', () => {
  test('turns the form into the body the API decodes', () => {
    const parsed = signupSchema.parse(form);
    expect(parsed).toMatchObject({
      supplier_name: 'ร้านทดสอบ',
      van_count: 3,
      delivery_count: 0,
      latitude: 13.7248,
      longitude: 100.534,
      erp_name: null,
      source_supplier_id: null,
      source_customer_id: null,
      source_region: null
    });
    // Blank asks the API to make them. The rest it refuses in the body.
    expect(parsed).toMatchObject({ admin_username: null, admin_password: null });
    for (const gone of ['region', 'vehicles']) {
      expect(parsed).not.toHaveProperty(gone);
    }
  });

  test('accepts its own output, because the server validates what the browser parsed', () => {
    const parsed = signupSchema.parse(form);
    expect(signupSchema.parse(parsed)).toEqual(parsed);
  });

  test('choosing products is optional', () => {
    expect(signupSchema.parse(form).catalog_brands).toEqual([]);
  });

  test('brands are names of principals, and none may be blank', () => {
    expect(
      signupSchema.parse({ ...form, catalog_brands: [' TBV ', 'Philip Morris'] }).catalog_brands
    ).toEqual(['TBV', 'Philip Morris']);
    expect(errorsOf({ ...form, catalog_brands: ['TBV', ' '] })['catalog_brands.1']).toBeString();
  });

  test('coordinates are optional, and blank is sent as zero', () => {
    const parsed = signupSchema.parse({ ...form, latitude: '', longitude: '' });
    expect(parsed).toMatchObject({ latitude: 0, longitude: 0 });
    expect(signupSchema.parse(parsed)).toEqual(parsed);
  });

  test('a postal code is 5 digits', () => {
    expect(errorsOf({ ...form, zipcode: '1050' }).zipcode).toBe('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
    expect(errorsOf({ ...form, zipcode: '10a00' }).zipcode).toBe('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
    expect(errorsOf({ ...form, zipcode: ' 10500 ' }).zipcode).toBeUndefined();
  });

  test('half a coordinate is an error', () => {
    expect(errorsOf({ ...form, longitude: '' }).longitude).toBe('กรอกลองจิจูดคู่กับละติจูด หรือเว้นว่างทั้งคู่');
    expect(errorsOf({ ...form, latitude: '' }).latitude).toBe('กรอกละติจูดคู่กับลองจิจูด หรือเว้นว่างทั้งคู่');
  });

  test('a value that is not a number is still an error', () => {
    const errors = errorsOf({ ...form, van_count: 'x', latitude: 'x', longitude: 'x' });
    expect(errors.van_count).toBe('จำนวนรถเร่ต้องเป็นตัวเลข');
    expect(errors.latitude).toBe('ละติจูดต้องเป็นตัวเลข');
    expect(errors.longitude).toBe('ลองจิจูดต้องเป็นตัวเลข');
  });

  test('rejects what the API would reject', () => {
    const errors = errorsOf({
      ...form,
      order_prefix: 'TOOLONG1',
      category: 'other',
      latitude: '91',
      longitude: 'abc',
      modules: [],
      van_count: '101'
    });
    for (const name of [
      'order_prefix',
      'category',
      'latitude',
      'longitude',
      'modules',
      'van_count'
    ]) {
      expect(errors[name]).toBeString();
    }
  });

  test('an ERP needs a name only when the customer has one', () => {
    expect(errorsOf({ ...form, has_erp: true }).erp_name).toBe('กรอกชื่อ ERP');
    expect(errorsOf({ ...form, has_erp: true, erp_name: 'SAP' }).erp_name).toBeUndefined();
  });

  test('the source supplier and customer come as a pair of UUIDs', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(errorsOf({ ...form, source_supplier_id: id }).source_customer_id).toBeString();
    expect(errorsOf({ ...form, source_customer_id: id }).source_supplier_id).toBeString();
    expect(
      errorsOf({ ...form, source_supplier_id: 'x', source_customer_id: id }).source_supplier_id
    ).toBeString();
    expect(errorsOf({ ...form, source_supplier_id: id, source_customer_id: id })).toEqual({});
  });

  test('an admin login that is typed is checked and kept as typed', () => {
    const parsed = signupSchema.parse({
      ...form,
      admin_username: ' owner ',
      admin_password: ' keep spaces '
    });
    expect(parsed).toMatchObject({ admin_username: 'owner', admin_password: ' keep spaces ' });
    expect(signupSchema.parse(parsed)).toEqual(parsed);
    const errors = errorsOf({ ...form, admin_username: 'a b', admin_password: 'short' });
    expect(errors.admin_username).toBeString();
    expect(errors.admin_password).toBe('รหัสผ่านต้องมีอย่างน้อย 8 ตัว หรือเว้นว่างให้ระบบสุ่ม');
  });

  test('vehicles need the module that uses them', () => {
    expect(errorsOf({ ...form, modules: ['b2b_sale'] }).van_count).toBe(
      'เลือก module Van Sale ก่อน จึงจะสร้างรถเร่ได้'
    );
    expect(errorsOf({ ...form, delivery_count: '2' }).delivery_count).toBe(
      'เลือก module Logistics ก่อน จึงจะสร้างรถส่งได้'
    );
    expect(errorsOf({ ...form, modules: ['van_sale', 'logistics'], delivery_count: '2' })).toEqual(
      {}
    );
  });

  test('a selected module needs at least one vehicle', () => {
    expect(errorsOf({ ...form, van_count: '' }).van_count).toBe(
      'กรอกจำนวนรถเร่อย่างน้อย 1 คัน เพราะเลือก module Van Sale'
    );
    expect(errorsOf({ ...form, modules: ['van_sale', 'logistics'] }).delivery_count).toBe(
      'กรอกจำนวนรถส่งอย่างน้อย 1 คัน เพราะเลือก module Logistics'
    );
    expect(errorsOf({ ...form, modules: ['b2b_sale'], van_count: '' })).toEqual({});
  });

  test('order_prefix is 2 to 4 letters or digits', () => {
    expect(errorsOf({ ...form, order_prefix: 'AB' })).toEqual({});
    expect(errorsOf({ ...form, order_prefix: 'AB12' })).toEqual({});
    expect(errorsOf({ ...form, order_prefix: 'ABC12' }).order_prefix).toBe(
      'ใช้ตัวอักษรอังกฤษหรือตัวเลข 2–4 ตัว'
    );
    expect(errorsOf({ ...form, order_prefix: 'A' }).order_prefix).toBeString();
  });

  test('a vehicle count is a whole number from 0 to 100', () => {
    expect(errorsOf({ ...form, van_count: '1.5' }).van_count).toBe('จำนวนรถเร่ต้องเป็นจำนวนเต็ม');
    expect(errorsOf({ ...form, van_count: '-1' }).van_count).toBe('จำนวนรถเร่ต้องไม่ติดลบ');
    expect(errorsOf({ ...form, van_count: '100' })).toEqual({});
  });

  test('requires a phone the API accepts, and an email only if one is typed', () => {
    const parsed = signupSchema.parse(form);
    expect(parsed).toMatchObject({ contact_phone: '081-234-5678', contact_email: null });
    expect(errorsOf({ ...form, contact_phone: '' }).contact_phone).toBe('กรอกเบอร์โทร');
    for (const phone of ['081', '081-ABC-5678', '+66 81 234 5678 99999']) {
      expect(errorsOf({ ...form, contact_phone: phone }).contact_phone).toBeDefined();
    }
    expect(errorsOf({ ...form, contact_phone: '+66 81 234 5678' }).contact_phone).toBeUndefined();
    expect(errorsOf({ ...form, contact_email: 'suda' }).contact_email).toBeDefined();
    expect(signupSchema.parse({ ...form, contact_email: ' suda@gmail.com ' }).contact_email).toBe(
      'suda@gmail.com'
    );
  });
});
