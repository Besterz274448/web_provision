-- Made-up requests that cover every status, for working on this UI locally.
-- Every store name, ID and error here is sample data. Run it only through dev/run-demo-api.sh.
-- The columns added by later migrations keep their defaults unless a statement below sets them.

INSERT INTO provisioning_requests
  (id, status, supplier_name, order_prefix, province, district, sub_district, zipcode, latitude, longitude, region,
   admin_username, has_erp, erp_name, supplier_id, erp_activation_status, trace_id, attempt_count, current_step,
   trigger_source, last_error_code, last_error_message, claim_expires_at, next_attempt_at, requested_at, started_at,
   tenant_completed_at, completed_at)
VALUES
('d0000000-0000-4000-8000-000000000001','processing','เจริญพาณิชย์ค้าส่ง','CRP','ขอนแก่น','เมือง','ในเมือง','40000',16.43,102.83,3,
 'admin_crp',0,NULL,'a0000000-0000-4000-8000-000000000001','not_required','4bf92f3577b34da6a3ce929d0e0e4736',1,'validate_flow_auth',
 'api',NULL,NULL,NOW(3) + INTERVAL 4 HOUR,NULL,NOW(3) - INTERVAL 1 MINUTE,NOW(3) - INTERVAL 50 SECOND,NULL,NULL),
('d0000000-0000-4000-8000-000000000002','processing','สหกิจซัพพลาย','SHK','นครราชสีมา','เมือง','ในเมือง','30000',14.97,102.1,3,
 'admin_shk',1,'SAP','a0000000-0000-4000-8000-000000000002','pending_activation','5cf92f3577b34da6a3ce929d0e0e4737',1,'write_auth',
 'api',NULL,NULL,NOW(3) + INTERVAL 4 HOUR,NULL,NOW(3) - INTERVAL 3 MINUTE,NOW(3) - INTERVAL 3 MINUTE,NOW(3) - INTERVAL 2 MINUTE,NULL),
('d0000000-0000-4000-8000-000000000003','pending','ทวีทรัพย์การค้า','TWS','สงขลา','หาดใหญ่','หาดใหญ่','90110',7.0,100.47,6,
 'admin_tws',0,NULL,NULL,'not_required',NULL,0,NULL,
 NULL,NULL,NULL,NULL,NULL,NOW(3) - INTERVAL 30 SECOND,NULL,NULL,NULL),
('d0000000-0000-4000-8000-000000000004','pending','บ้านไร่เทรดดิ้ง','BRT','อุทัยธานี','บ้านไร่','บ้านไร่','61140',15.08,99.52,2,
 'admin_brt',0,NULL,'a0000000-0000-4000-8000-000000000004','not_required','6df92f3577b34da6a3ce929d0e0e4738',2,NULL,
 'sweep','db_lock','database lock timeout or deadlock',NULL,NOW(3) + INTERVAL 4 HOUR,NOW(3) - INTERVAL 12 MINUTE,NOW(3) - INTERVAL 12 MINUTE,NULL,NULL),
('d0000000-0000-4000-8000-000000000005','failed','รุ่งเรืองดิสทริบิวชัน','RRD','ปราจีนบุรี','กบินทร์บุรี','เมืองเก่า','25240',14.0,101.7,1,
 'admin_rrd',0,NULL,'a0000000-0000-4000-8000-000000000005','not_required','7ef92f3577b34da6a3ce929d0e0e4739',5,'write_flow_auth',
 'sweep','db_schema','mysql error: Unknown column ''tenant_ref'' in ''field list''',NULL,NULL,NOW(3) - INTERVAL 2 HOUR,NOW(3) - INTERVAL 2 HOUR,NULL,NOW(3) - INTERVAL 95 MINUTE),
('d0000000-0000-4000-8000-000000000006','rejected','นครชัยค้าปลีก','NC','นครสวรรค์','เมือง','ปากน้ำโพ','60000',15.7,100.13,2,
 'admin_nc',0,NULL,'a0000000-0000-4000-8000-000000000006','not_required','8ff92f3577b34da6a3ce929d0e0e4730',1,'validate_flow_auth',
 'api','duplicate_order_prefix','order prefix is not available',NULL,NULL,NOW(3) - INTERVAL 40 MINUTE,NOW(3) - INTERVAL 40 MINUTE,NULL,NOW(3) - INTERVAL 40 MINUTE),
('d0000000-0000-4000-8000-000000000007','completed_with_errors','พูนผลดิสทริบิวเตอร์','PPD','เชียงใหม่','เมือง','ศรีภูมิ','50200',18.79,98.98,5,
 'admin_ppd',0,NULL,'a0000000-0000-4000-8000-000000000007','not_required','90f92f3577b34da6a3ce929d0e0e4731',1,NULL,
 'api',NULL,NULL,NULL,NULL,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 179 MINUTE,NOW(3) - INTERVAL 178 MINUTE),
('d0000000-0000-4000-8000-000000000008','completed','เอกชัยมาร์ท','EKC','สมุทรสาคร','เมือง','มหาชัย','74000',13.55,100.27,1,
 'admin_ekc',0,NULL,'a0000000-0000-4000-8000-000000000008','not_required','a1f92f3577b34da6a3ce929d0e0e4732',1,NULL,
 'api',NULL,NULL,NULL,NULL,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 299 MINUTE,NOW(3) - INTERVAL 298 MINUTE),
('d0000000-0000-4000-8000-000000000009','completed','บริษัท ศรีสมบูรณ์ เทรดดิ้ง แอนด์ ดิสทริบิวชัน (ประเทศไทย) จำกัด','SSB','กรุงเทพมหานคร','บางนา','บางนาเหนือ','10260',13.67,100.6,1,
 'admin_ssb',1,'BPlus','a0000000-0000-4000-8000-000000000009','pending_activation','b2f92f3577b34da6a3ce929d0e0e4733',1,NULL,
 'api',NULL,NULL,NULL,NULL,NOW(3) - INTERVAL 1 DAY,NOW(3) - INTERVAL 1 DAY,NOW(3) - INTERVAL 1 DAY + INTERVAL 1 MINUTE,NOW(3) - INTERVAL 1 DAY + INTERVAL 3 MINUTE),
('d0000000-0000-4000-8000-000000000010','completed','ลำปางค้าส่ง','LPG','ลำปาง','เมือง','สบตุ๋ย','52100',18.29,99.49,5,
 'admin_lpg',0,NULL,'a0000000-0000-4000-8000-000000000010','not_required','c3f92f3577b34da6a3ce929d0e0e4734',1,NULL,
 'sweep',NULL,NULL,NULL,NULL,NOW(3) - INTERVAL 2 DAY,NOW(3) - INTERVAL 2 DAY,NOW(3) - INTERVAL 2 DAY + INTERVAL 1 MINUTE,NOW(3) - INTERVAL 2 DAY + INTERVAL 1 MINUTE);

INSERT INTO vehicle_requests
  (id, request_id, status, vehicle_type, is_trial, username, van_code, van_name, personal_id, firstname, lastname, license_id, vehicle_name,
   full_username, last_error_code, last_error_message, completed_at)
VALUES
('e0000000-0000-4000-8000-000000000101','d0000000-0000-4000-8000-000000000001','pending','van',0,'van01','CRP-V01','รถเร่ 1','DEMO000000101','ตัวอย่าง','หนึ่ง','DM0101','รถเร่ 1',NULL,NULL,NULL,NULL),
('e0000000-0000-4000-8000-000000000102','d0000000-0000-4000-8000-000000000001','pending','delivery',0,'pod01','CRP-P01','รถส่ง 1','DEMO000000102','ตัวอย่าง','สอง','DM0102','รถส่ง 1',NULL,NULL,NULL,NULL),
('e0000000-0000-4000-8000-000000000201','d0000000-0000-4000-8000-000000000002','completed','van',0,'van01','SHK-V01','รถเร่ 1','DEMO000000201','ตัวอย่าง','หนึ่ง','DM0201','รถเร่ 1','van01SHK',NULL,NULL,NOW(3) - INTERVAL 100 SECOND),
('e0000000-0000-4000-8000-000000000202','d0000000-0000-4000-8000-000000000002','completed','van',0,'van02','SHK-V02','รถเร่ 2','DEMO000000202','ตัวอย่าง','สอง','DM0202','รถเร่ 2','van02SHK',NULL,NULL,NOW(3) - INTERVAL 80 SECOND),
('e0000000-0000-4000-8000-000000000203','d0000000-0000-4000-8000-000000000002','completed','delivery',0,'pod01','SHK-P01','รถส่ง 1','DEMO000000203','ตัวอย่าง','สาม','DM0203','รถส่ง 1','pod01SHK',NULL,NULL,NOW(3) - INTERVAL 60 SECOND),
('e0000000-0000-4000-8000-000000000204','d0000000-0000-4000-8000-000000000002','processing','delivery',0,'pod02','SHK-P02','รถส่ง 2','DEMO000000204','ตัวอย่าง','สี่','DM0204','รถส่ง 2','pod02SHK',NULL,NULL,NULL),
('e0000000-0000-4000-8000-000000000205','d0000000-0000-4000-8000-000000000002','pending','delivery',0,'pod03','SHK-P03','รถส่ง 3','DEMO000000205','ตัวอย่าง','ห้า','DM0205','รถส่ง 3',NULL,NULL,NULL,NULL),
('e0000000-0000-4000-8000-000000000206','d0000000-0000-4000-8000-000000000002','pending','van',0,'van03','SHK-V03','รถเร่ 3','DEMO000000206','ตัวอย่าง','หก','DM0206','รถเร่ 3',NULL,NULL,NULL,NULL),
('e0000000-0000-4000-8000-000000000701','d0000000-0000-4000-8000-000000000007','completed','van',0,'van01','PPD-V01','รถเร่ 1','DEMO000000701','ตัวอย่าง','หนึ่ง','DM0701','รถเร่ 1','van01PPD',NULL,NULL,NOW(3) - INTERVAL 178 MINUTE),
('e0000000-0000-4000-8000-000000000702','d0000000-0000-4000-8000-000000000007','completed','van',0,'van02','PPD-V02','รถเร่ 2','DEMO000000702','ตัวอย่าง','สอง','DM0702','รถเร่ 2','van02PPD',NULL,NULL,NOW(3) - INTERVAL 178 MINUTE),
('e0000000-0000-4000-8000-000000000703','d0000000-0000-4000-8000-000000000007','rejected','delivery',0,'pod01','PPD-P01','รถส่ง 1','DEMO000000703','ตัวอย่าง','สาม','DM0703','รถส่ง 1','pod01PPD','invalid_input','personal_id must be 13 digits',NULL),
('e0000000-0000-4000-8000-000000000704','d0000000-0000-4000-8000-000000000007','completed','delivery',0,'pod02','PPD-P02','รถส่ง 2','DEMO000000704','ตัวอย่าง','สี่','DM0704','รถส่ง 2','pod02PPD',NULL,NULL,NOW(3) - INTERVAL 178 MINUTE),
('e0000000-0000-4000-8000-000000000801','d0000000-0000-4000-8000-000000000008','completed','van',1,'demo_van','DEMOVAN','รถเร่ทดลอง','DEMO000000801','ทดลอง','รถเร่ทดลอง','DM0801','รถเร่ทดลอง','demo_vanEKC',NULL,NULL,NOW(3) - INTERVAL 298 MINUTE),
('e0000000-0000-4000-8000-000000000802','d0000000-0000-4000-8000-000000000008','completed','delivery',1,'demo_pod','DEMOPOD','รถส่งทดลอง','DEMO000000802','ทดลอง','รถส่งทดลอง','DM0802','รถส่งทดลอง','demo_podEKC',NULL,NULL,NOW(3) - INTERVAL 298 MINUTE);

-- A big fleet, so the track has to merge its ticks into one bar.
INSERT INTO vehicle_requests
  (id, request_id, status, vehicle_type, is_trial, username, van_code, van_name, personal_id, firstname, lastname, license_id, vehicle_name, full_username, completed_at)
WITH RECURSIVE n AS (SELECT 1 AS i UNION ALL SELECT i + 1 FROM n WHERE i < 24)
SELECT CONCAT('e0000000-0000-4000-8000-0000000009', LPAD(i, 2, '0')), 'd0000000-0000-4000-8000-000000000009', 'completed', 'van', 0,
       CONCAT('van', i), CONCAT('SSB-V', LPAD(i, 2, '0')), CONCAT('รถเร่ ', i), CONCAT('DEMO0000009', LPAD(i, 2, '0')), 'ตัวอย่าง', CONCAT('คันที่ ', i),
       CONCAT('DM09', LPAD(i, 2, '0')), CONCAT('รถเร่ ', i), CONCAT('van', i, 'SSB'), NOW(3) - INTERVAL 1 DAY + INTERVAL 3 MINUTE
FROM n;

INSERT INTO provisioning_step_logs
  (request_id, vehicle_request_id, attempt, step, target_db, status, rows_affected, started_at, finished_at, duration_ms, error_code, error_message)
VALUES
-- Running now: DMS is done, R9 is being written.
('d0000000-0000-4000-8000-000000000001',NULL,1,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 50 SECOND,NOW(3) - INTERVAL 50 SECOND,84,NULL,NULL),
('d0000000-0000-4000-8000-000000000001',NULL,1,'dms.supplier','dms','executed',1,NOW(3) - INTERVAL 49 SECOND,NOW(3) - INTERVAL 49 SECOND,12,NULL,NULL),
('d0000000-0000-4000-8000-000000000001',NULL,1,'write_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 49 SECOND,NOW(3) - INTERVAL 40 SECOND,9120,NULL,NULL),
-- Waiting for its third attempt after two lock timeouts.
('d0000000-0000-4000-8000-000000000004',NULL,1,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 12 MINUTE,NOW(3) - INTERVAL 12 MINUTE,91,NULL,NULL),
('d0000000-0000-4000-8000-000000000004',NULL,1,'write_dms','dms','rolled_back',NULL,NOW(3) - INTERVAL 12 MINUTE,NOW(3) - INTERVAL 11 MINUTE,50021,'db_lock','database lock timeout or deadlock'),
('d0000000-0000-4000-8000-000000000004',NULL,2,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 11 MINUTE,NOW(3) - INTERVAL 11 MINUTE,77,NULL,NULL),
('d0000000-0000-4000-8000-000000000004',NULL,2,'write_dms','dms','rolled_back',NULL,NOW(3) - INTERVAL 11 MINUTE,NOW(3) - INTERVAL 10 MINUTE,50018,'db_lock','database lock timeout or deadlock'),
-- Failed for good: DMS and R9 are skipped on later attempts, Auth keeps failing.
('d0000000-0000-4000-8000-000000000005',NULL,1,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 2 HOUR,NOW(3) - INTERVAL 2 HOUR,101,NULL,NULL),
('d0000000-0000-4000-8000-000000000005',NULL,1,'write_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 2 HOUR,NOW(3) - INTERVAL 2 HOUR,8840,NULL,NULL),
('d0000000-0000-4000-8000-000000000005',NULL,1,'write_r9','r9','succeeded',NULL,NOW(3) - INTERVAL 2 HOUR,NOW(3) - INTERVAL 2 HOUR,412,NULL,NULL),
('d0000000-0000-4000-8000-000000000005',NULL,1,'write_flow_auth',NULL,'rolled_back',NULL,NOW(3) - INTERVAL 2 HOUR,NOW(3) - INTERVAL 2 HOUR,120,'db_schema','mysql error: Unknown column ''tenant_ref'' in ''field list'''),
('d0000000-0000-4000-8000-000000000005',NULL,5,'write_dms','dms','skipped',NULL,NOW(3) - INTERVAL 95 MINUTE,NOW(3) - INTERVAL 95 MINUTE,0,NULL,NULL),
('d0000000-0000-4000-8000-000000000005',NULL,5,'write_r9','r9','skipped',NULL,NOW(3) - INTERVAL 95 MINUTE,NOW(3) - INTERVAL 95 MINUTE,0,NULL,NULL),
('d0000000-0000-4000-8000-000000000005',NULL,5,'auth.supplier','auth','failed',0,NOW(3) - INTERVAL 95 MINUTE,NOW(3) - INTERVAL 95 MINUTE,18,'db_schema','mysql error: Unknown column ''tenant_ref'' in ''field list'''),
('d0000000-0000-4000-8000-000000000005',NULL,5,'write_flow_auth',NULL,'rolled_back',NULL,NOW(3) - INTERVAL 95 MINUTE,NOW(3) - INTERVAL 95 MINUTE,131,'db_schema','mysql error: Unknown column ''tenant_ref'' in ''field list'''),
-- Rejected on validation.
('d0000000-0000-4000-8000-000000000006',NULL,1,'validate_flow_auth',NULL,'failed',NULL,NOW(3) - INTERVAL 40 MINUTE,NOW(3) - INTERVAL 40 MINUTE,6,'duplicate_order_prefix','order prefix is not available'),
-- Tenant done, one vehicle rejected.
('d0000000-0000-4000-8000-000000000007',NULL,1,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 3 HOUR,88,NULL,NULL),
('d0000000-0000-4000-8000-000000000007',NULL,1,'write_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 3 HOUR,10230,NULL,NULL),
('d0000000-0000-4000-8000-000000000007',NULL,1,'write_r9','r9','succeeded',NULL,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 3 HOUR,380,NULL,NULL),
('d0000000-0000-4000-8000-000000000007',NULL,1,'write_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 3 HOUR,NOW(3) - INTERVAL 3 HOUR,240,NULL,NULL),
('d0000000-0000-4000-8000-000000000007','e0000000-0000-4000-8000-000000000701',1,'write_vehicle_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 178 MINUTE,NOW(3) - INTERVAL 178 MINUTE,1420,NULL,NULL),
('d0000000-0000-4000-8000-000000000007','e0000000-0000-4000-8000-000000000701',1,'write_vehicle_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 178 MINUTE,NOW(3) - INTERVAL 178 MINUTE,96,NULL,NULL),
-- Clean run with trial vehicles.
('d0000000-0000-4000-8000-000000000008',NULL,1,'validate_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 5 HOUR,72,NULL,NULL),
('d0000000-0000-4000-8000-000000000008',NULL,1,'write_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 5 HOUR,9410,NULL,NULL),
('d0000000-0000-4000-8000-000000000008',NULL,1,'write_r9','r9','succeeded',NULL,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 5 HOUR,355,NULL,NULL),
('d0000000-0000-4000-8000-000000000008',NULL,1,'write_flow_auth',NULL,'succeeded',NULL,NOW(3) - INTERVAL 5 HOUR,NOW(3) - INTERVAL 5 HOUR,212,NULL,NULL),
('d0000000-0000-4000-8000-000000000008','e0000000-0000-4000-8000-000000000801',1,'write_vehicle_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 298 MINUTE,NOW(3) - INTERVAL 298 MINUTE,1305,NULL,NULL),
('d0000000-0000-4000-8000-000000000008','e0000000-0000-4000-8000-000000000802',1,'write_vehicle_dms','dms','succeeded',NULL,NOW(3) - INTERVAL 298 MINUTE,NOW(3) - INTERVAL 298 MINUTE,1290,NULL,NULL);

-- flow-api writes the tenant and its vehicles before flow-auth creates the logins.
UPDATE provisioning_requests SET flow_api_completed_at = tenant_completed_at WHERE tenant_completed_at IS NOT NULL;
UPDATE provisioning_requests SET auth_completed_at = completed_at WHERE status IN ('completed', 'completed_with_errors');
UPDATE provisioning_requests SET modules = '["b2b_sale","van_sale"]', category = 'agent';

-- Waiting for flow-api, and one that went silent.
UPDATE provisioning_requests SET status = 'handed_off', current_step = 'handoff_flow_api',
  handoff_deadline = NOW(3) + INTERVAL 8 MINUTE, flow_api_completed_at = NULL, tenant_completed_at = NULL, claim_expires_at = NULL
WHERE id = 'd0000000-0000-4000-8000-000000000001';
UPDATE provisioning_requests SET status = 'pending', current_step = NULL, claim_expires_at = NULL
WHERE id = 'd0000000-0000-4000-8000-000000000002';
INSERT INTO provisioning_requests
  (id, status, supplier_name, order_prefix, province, district, sub_district, zipcode, latitude, longitude, region,
   admin_username, has_erp, supplier_id, erp_activation_status, attempt_count, trigger_source, last_error_code,
   last_error_message, modules, requested_at, started_at)
VALUES
('d0000000-0000-4000-8000-000000000011','stalled','สยามเงียบการค้า','SYM','สระบุรี','เมือง','ปากเพรียว','18000',14.53,100.91,1,
 'admin_sym',0,'a0000000-0000-4000-8000-000000000011','not_required',5,'sweep','callback_timeout','flow-api did not report back in time',
 '["van_sale"]',NOW(3) - INTERVAL 90 MINUTE,NOW(3) - INTERVAL 90 MINUTE);

-- A customer who bought before, whose starting products could not be created.
UPDATE provisioning_requests SET status = 'completed_with_errors', catalog_status = 'failed',
  source_supplier_id = '11111111-1111-4111-8111-111111111111', source_customer_id = '22222222-2222-4222-8222-222222222222',
  catalog_error_code = 'clickhouse_unavailable', catalog_error_message = 'cannot read purchase history'
WHERE id = 'd0000000-0000-4000-8000-000000000010';
UPDATE provisioning_requests SET catalog_status = 'completed', catalog_found = 128, catalog_inserted = 121, catalog_skipped = '{"no_price":5,"no_brand":2}',
  source_supplier_id = '11111111-1111-4111-8111-111111111111', source_customer_id = '22222222-2222-4222-8222-222222222222'
WHERE id = 'd0000000-0000-4000-8000-000000000009';

-- From the survey: two waiting for a person, and one turned down. The request holds only what
-- makes a tenant; the survey tables hold the form as it was sent.
INSERT INTO provisioning_requests
  (id, status, supplier_name, order_prefix, province, district, sub_district, zipcode, latitude, longitude, region, category,
   admin_username, erp_activation_status, modules, requested_at, reviewed_by, reviewed_at, decline_reason)
VALUES
('d0000000-0000-4000-8000-000000000021','awaiting_approval','สุดาเทรดดิ้ง','','ชลบุรี','','','',0,0,0,'','','not_required','["van_sale","logistics","erp_integration","pos"]',NOW(3) - INTERVAL 25 MINUTE,NULL,NULL,NULL),
('d0000000-0000-4000-8000-000000000022','awaiting_approval','','','เชียงใหม่','','','',0,0,0,'','','not_required','["b2b_sale"]',NOW(3) - INTERVAL 3 DAY,NULL,NULL,NULL),
('d0000000-0000-4000-8000-000000000023','declined','','','ขอนแก่น','','','',0,0,0,'','','not_required',NULL,NOW(3) - INTERVAL 5 DAY,'admin',NOW(3) - INTERVAL 4 DAY,'เบอร์ติดต่อไม่ได้');
INSERT INTO survey_submissions (id, request_id, survey_id, version, form_token, line_sub_id, submitted_at) VALUES
('e1000000-0000-4000-8000-000000000021','d0000000-0000-4000-8000-000000000021','6f55c5a0-25d6-43ac-83f7-909379381dd6',11,'demo-form-1','U4af4980629demo',NOW(3) - INTERVAL 25 MINUTE),
('e1000000-0000-4000-8000-000000000022','d0000000-0000-4000-8000-000000000022','6f55c5a0-25d6-43ac-83f7-909379381dd6',10,'demo-form-2',NULL,NOW(3) - INTERVAL 3 DAY),
('e1000000-0000-4000-8000-000000000023','d0000000-0000-4000-8000-000000000023','6f55c5a0-25d6-43ac-83f7-909379381dd6',10,'demo-form-3',NULL,NOW(3) - INTERVAL 5 DAY);
INSERT INTO survey_answers (submission_id, position, question_id, question_name, question_type, value) VALUES
('e1000000-0000-4000-8000-000000000021',1,'0','ชื่อกิจการ','text','"สุดาเทรดดิ้ง"'),
('e1000000-0000-4000-8000-000000000021',2,'1','ชื่อ นามสกุล','text','"สุดารัตน์ ครีม"'),
('e1000000-0000-4000-8000-000000000021',3,'2','เบอร์โทร','phone','"0989898978"'),
('e1000000-0000-4000-8000-000000000021',4,'3','Email','text',NULL),
('e1000000-0000-4000-8000-000000000021',5,'4','รูปแบบธุรกิจ','multiple_choice','["เจ้าของตราสินค้า", "ตัวแทนจำหน่าย", "ขายส่ง", "ร้านค้าปลีก"]'),
('e1000000-0000-4000-8000-000000000021',6,'5','ประเภทสินค้าที่จัดจำหน่าย','multiple_choice','["thaibev"]'),
('e1000000-0000-4000-8000-000000000021',7,'6','ประเภทสินค้าที่จัดจำหน่าย (อื่นๆ)','text',NULL),
('e1000000-0000-4000-8000-000000000021',8,'7','จังหวัด','dropdown','"ชลบุรี"'),
('e1000000-0000-4000-8000-000000000021',9,'8','จำนวนลูกค้าในร้าน','single_choice','"น้อยกว่า 100 คน"'),
('e1000000-0000-4000-8000-000000000021',10,'9','นัดหมายวัน Demo','datetime','"2026-11-11T20:00:00+07:00"'),
('e1000000-0000-4000-8000-000000000021',11,'10','สนใจ','multiple_choice','["Demo Feature - Van Sale", "Demo Feature - Logistics", "Demo Feature - ERP Integration", "Demo Feature - POS"]'),
('e1000000-0000-4000-8000-000000000021',12,'11','sale ที่ติดต่อ','single_choice','"001 คุณติ้ว"'),
('e1000000-0000-4000-8000-000000000021',13,'12','อื่นๆ','text',NULL),
('e1000000-0000-4000-8000-000000000022',1,'1','ชื่อ นามสกุล','text','"ประเสริฐ ใจดี"'),
('e1000000-0000-4000-8000-000000000022',2,'2','เบอร์โทร','phone','"0812345678"'),
('e1000000-0000-4000-8000-000000000022',3,'7','จังหวัด','dropdown','"เชียงใหม่"'),
('e1000000-0000-4000-8000-000000000022',4,'10','สนใจ','multiple_choice','["Demo Feature - B2B Sale"]'),
('e1000000-0000-4000-8000-000000000023',1,'1','ชื่อ นามสกุล','text','"วิภา ทดสอบ"'),
('e1000000-0000-4000-8000-000000000023',2,'2','เบอร์โทร','phone','"0899999999"');
