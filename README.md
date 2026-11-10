# Tenant Provisioning Console

หน้าเว็บสำหรับทีมภายใน ใช้ส่งคำขอ Provisioning ใหม่ ดูว่าคำขอไหนกำลังทำอยู่ ไหนล้ม และไหนสำเร็จแล้ว กดลองใหม่ ดู username และรหัสผ่านทั้งหมดเพื่อส่งให้ลูกค้า และดาวน์โหลดใบข้อมูลเข้าระบบ ทุกอย่างทำผ่าน API ของ [tenant-provisioning](../tenant-provisioning/README.md)

โครงมาจาก [kiranism/tanstack-start-dashboard](https://github.com/Kiranism/tanstack-start-dashboard) (MIT ดู [LICENSE](LICENSE)) โดยคัดมาเฉพาะส่วนที่ใช้: TanStack Start, shadcn/ui, Tailwind v4 และ data table

## การเข้าสู่ระบบ

ทุกหน้าและทุก server function ต้อง login ก่อน หน้านี้ตรวจรหัสผ่านผ่าน `POST /auth/login` ของ [tenant-provisioning](../tenant-provisioning/README.md#การ-login) บัญชีอยู่ในตาราง `console_users` และไม่มีหน้าสมัครเอง

รัน `seeds/console_users.sql` ของ tenant-provisioning เพื่อสร้างบัญชีแรก คือ `admin` รหัส `pass@word1` รหัสนี้เป็นที่รู้กันทั่วไป จึงต้องเปลี่ยนทันทีบน DB ที่ไม่ใช่ของเครื่อง dev

สร้าง hash ของรหัสผ่านด้วยคำสั่งนี้ ค่าที่ได้เก็บเฉพาะ hash ไม่ใช่ตัวรหัสเอง:

```bash
htpasswd -bnBC 12 '' 'รหัสผ่าน' | tr -d ':\n'
```

| ต้องการ       | วิธี                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เพิ่มคน        | `INSERT INTO console_users (id, username, password_hash) VALUES (UUID(), 'somchai', '<hash>');` ใช้ username ตัวพิมพ์เล็ก เพราะหน้า login แปลงเป็นตัวพิมพ์เล็กก่อนส่ง |
| เอาคนออก     | ลบแถวของคนนั้น คนนั้นจะหลุดทันทีแม้ cookie ยังไม่หมดอายุ                                                                                                            |
| เปลี่ยนรหัสผ่าน  | `UPDATE console_users SET password_hash = '<hash>' WHERE username = 'somchai';` session ที่ login ค้างไว้จะยังใช้ได้จนหมดอายุ                                    |
| ให้ทุกคนหลุดทันที | เปลี่ยน `SESSION_SECRET` แล้ว restart                                                                                                                       |

ถ้า API ติดต่อไม่ได้ จะ login ใหม่ไม่ได้ ส่วนคนที่ login อยู่แล้วจะไม่หลุด แต่จะเห็นข้อความว่าเชื่อมต่อ API ไม่ได้แทนข้อมูล

- Session อยู่ได้ 12 ชั่วโมง
- ใส่รหัสผิด 5 ครั้งต่อชื่อผู้ใช้ จะถูกล็อก 15 นาที ตัวนับอยู่ในหน่วยความจำของแต่ละ process จึงรีเซ็ตเมื่อ restart
- Production ต้องเปิดผ่าน **HTTPS** เพราะ cookie ตั้งเป็น `Secure` ถ้าเปิดผ่าน HTTP เบราว์เซอร์จะไม่เก็บ cookie และ login ไม่ติด
- ไม่มีลืมรหัสผ่านแบบบริการตัวเอง และไม่มี 2FA ถ้าองค์กรมี SSO ควรย้ายไปใช้ SSO แทน โดยแก้ที่ `src/features/auth/`

## ก่อนนำขึ้นใช้งาน

`PROVISIONING_SERVICE_TOKEN` อยู่บนเซิร์ฟเวอร์ของหน้านี้ และไม่ถูกส่งไปที่เบราว์เซอร์ เพราะเบราว์เซอร์เรียก API ผ่าน server function ห้ามตั้งชื่อตัวแปรนี้ขึ้นต้นด้วย `VITE_`

ทุกคนที่ login ได้จะเห็นชื่อลูกค้า username ของรถ และข้อความ error ทั้งหมด และ**ตั้ง Tenant ใหม่ กดลองใหม่ หรือดาวน์โหลดรหัสรถได้** เพราะยังไม่มีการแบ่งสิทธิ์ จึงควรให้บัญชีเฉพาะคนที่มีหน้าที่นี้

การเปิดดูรหัสผ่านและการดาวน์โหลดใบข้อมูลเข้าระบบถูกบันทึกในชื่อผู้ใช้ที่ login แต่ API ยังไม่เก็บว่าใครส่งคำขอใหม่หรือกดลองใหม่

## รัน

ต้องมี [Bun](https://bun.sh)

```bash
bun install
```

```bash
cp .env.example .env
```

ตั้งค่าตัวแปรใน `.env` ตามคำอธิบายในไฟล์ แล้วรัน:

```bash
bun run dev
```

หน้าเว็บเปิดที่ http://localhost:3000

### ลองด้วยข้อมูลตัวอย่าง

ถ้ายังไม่มีฐานข้อมูลจริง สคริปต์นี้รัน API ตัวจริงบนข้อมูลตัวอย่างที่ครอบคลุมทุกสถานะ โดยใช้ MySQL จาก `docker-compose.test.yml` และสร้าง DB `demo_provisioning` ใหม่ทุกครั้ง ข้อมูลใน [dev/demo-seed.sql](dev/demo-seed.sql) เป็นข้อมูลสมมติทั้งหมด

flow-api และ flow-auth ถูกแทนด้วย [dev/fake-flow.ts](dev/fake-flow.ts) จึงส่งคำขอจากฟอร์มได้ครบทุกขั้นโดยไม่แตะระบบจริง Order prefix ที่กรอกเป็นตัวกำหนดผล:

| Prefix ขึ้นต้นด้วย | ผล                                                                   |
| -------------- | -------------------------------------------------------------------- |
| `DUP`          | flow-auth แจ้งว่า prefix ซ้ำ ปุ่มตรวจสอบในฟอร์มจะบอกว่าใช้ไม่ได้ และส่งคำขอไม่ได้ |
| `REJ`          | flow-api ปฏิเสธข้อมูล                                                   |
| `ERR`          | flow-api ล้ม และรอลองใหม่                                              |
| `HUSH`         | flow-api ไม่ตอบกลับ                                                    |
| `VAN`          | รถคันแรกล้ม                                                            |
| อื่น ๆ           | สำเร็จ                                                                |

sweep ปิดอยู่เพื่อให้ข้อมูลตัวอย่างคงที่ `ERR` และ `HUSH` จึงค้างที่สถานะรอ และไม่ลองใหม่เอง

```bash
sh dev/run-demo-api.sh
```

จากนั้นตั้ง `.env` เป็น `PROVISIONING_API_URL=http://localhost:18080` และ `PROVISIONING_SERVICE_TOKEN=demo-token` แล้ว login ด้วย `admin` รหัส `pass@word1`

## Production

```bash
bun run build
```

```bash
bun run start
```

ตอน production ไฟล์ `.env` ไม่ถูกโหลดอัตโนมัติ ต้องตั้ง `PROVISIONING_API_URL`, `PROVISIONING_SERVICE_TOKEN` และ `SESSION_SECRET` จากระบบที่ใช้ deploy ถ้าไม่มี `SESSION_SECRET` ทุกหน้าจะแสดงข้อผิดพลาด

## ตรวจโค้ด

```bash
bun test src
```

```bash
bun run typecheck
```

```bash
bunx oxlint
```

## โครงสร้าง

| ที่อยู่                                           | หน้าที่                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/routes/dashboard/provisioning/`          | หน้ารายการคำขอ, ฟอร์ม `new` และหน้ารายละเอียด `$id`                                        |
| `src/routes/api/provisioning/`                | ดาวน์โหลดใบข้อมูลเข้าระบบ โดยส่งชื่อผู้ใช้เป็น `X-Actor`                                          |
| `src/features/provisioning/schemas/signup.ts` | กฎของฟอร์ม ใช้ทั้งเบราว์เซอร์และเซิร์ฟเวอร์ และต้องตรงกับ `validate.go`                           |
| `src/features/auth/`                          | บัญชีผู้ใช้ session หน้า login และ `authMiddleware` ที่ server function ทุกตัวต้องใช้              |
| `src/features/provisioning/api/`              | เรียก API ผ่าน server function และตั้งรอบรีเฟรช                                             |
| `src/features/provisioning/lib/progress.ts`   | แปลงสถานะคำขอเป็นขั้นตอน ตรวจข้อมูล → สร้าง Tenant (flow-api) → สร้าง Login (flow-auth) และรถ |
| `src/features/provisioning/components/`       | ตาราง แถบความคืบหน้า และประวัติการทำงาน                                                    |
| `src/styles/themes/dms.css`                   | ธีม ดูรายละเอียดใน [DESIGN.md](DESIGN.md)                                                 |

รายการรีเฟรชทุก 10 วินาที หน้ารายละเอียดรีเฟรชทุก 5 วินาที ถ้า API ล่มระหว่างเปิดหน้าอยู่ ข้อมูลเดิมจะยังแสดงพร้อมข้อความบอกว่าเป็นของเวลาไหน
