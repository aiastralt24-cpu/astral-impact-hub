// Isolated PostgreSQL integration check. Never connects to the live database.
// PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-email-notifications.mjs
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to an installed @electric-sql/pglite module.');
const {PGlite}=await import(process.env.PGLITE_MODULE);
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role;');
let schema=readFileSync('supabase/migrations/0001_initial_schema.sql','utf8').split('alter table public.users enable row level security;')[0].replace('create extension if not exists "pgcrypto";','');
await db.exec(schema);
await db.exec(readFileSync('supabase/migrations/0003_access_model_extensions.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/0007_email_notifications.sql','utf8'));
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const admin=id(1),employee=id(2),owner=id(3),csr=id(4),other=id(5),vendor=id(10),project=id(20),update=id(30);
await db.query(`insert into users(id,full_name,email,role,assigned_project_ids,assigned_vendor_ids) values
 ($1,'Admin','admin@example.org','admin','{}','{}'),
 ($2,'Employee','employee@example.org','content_team',array[$7::uuid],'{}'),
 ($3,'Owner','owner@example.org','project_manager','{}','{}'),
 ($4,'CSR','csr@example.org','vendor','{}',array[$6::uuid]),
 ($5,'Other','other@example.org','vendor',array[$7::uuid],'{}')`,[admin,employee,owner,csr,other,vendor,project]);
await db.query("insert into vendors(id,name,primary_contact_name,email) values($1,'CSR Org','Contact','CSR@example.org')",[vendor]);
await db.query(`insert into projects(id,name,category,sub_category,state,district,start_date,end_date,budget_inr,reporting_frequency,internal_owner_id) values($1,'Water','Education','','Gujarat','Ahmedabad','2026-01-01','2026-12-31',0,'weekly',$2)`,[project,owner]);
assert.equal((await db.query('select * from email_notifications')).rows.length,3);
await db.query('insert into project_vendors(project_id,vendor_id) values($1,$2)',[project,vendor]);
const recipients=(await db.query('select email from project_email_recipients($1) order by email',[project])).rows.map(r=>r.email);
assert.deepEqual(recipients,['admin@example.org','csr@example.org','employee@example.org','owner@example.org']);
await db.exec('delete from email_notifications;');
await db.query("update projects set name=name,health_score=80 where id=$1",[project]);
assert.equal((await db.query('select * from email_notifications')).rows.length,0,'no-op / computed scores must not send');
await db.exec('begin');await db.query("update projects set name='Rolled back' where id=$1",[project]);await db.exec('rollback');
assert.equal((await db.query('select * from email_notifications')).rows.length,0,'rolled back changes must not send');
await db.query("update projects set project_brief='SENSITIVE BODY' where id=$1",[project]);
let rows=(await db.query('select * from email_notifications')).rows;
assert.equal(rows.length,4);assert.deepEqual(rows[0].changed_fields,['project_brief']);assert.ok(!JSON.stringify(rows).includes('SENSITIVE BODY'));
const [first,second]=await Promise.all([db.query('select * from claim_project_emails(2)'),db.query('select * from claim_project_emails(2)')]);
assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,4,'concurrent workers claim disjoint deliveries');
assert.equal((await db.query('select * from claim_project_emails(5)')).rows.length,0);
await db.exec("update email_notifications set lease_until=now()-interval '1 minute'");
assert.equal((await db.query('select * from claim_project_emails(5)')).rows.length,4,'expired leases are recoverable');
await db.exec("update email_notifications set lease_until=now()-interval '1 minute', first_attempt_at=now()-interval '24 hours'");
assert.equal((await db.query('select * from claim_project_emails(5)')).rows.length,0,'expired idempotency windows are never retried');
assert.equal((await db.query("select * from email_notifications where status='failed'")).rows.length,4);
await db.exec('delete from email_notifications');
await db.query(`insert into updates(id,project_id,vendor_id,submitted_by_user_id,happened_at,description,sensitive_content,progress_percent) values($1,$2,$3,$4,'2026-11-13','PRIVATE ACTIVITY',true,0)`,[update,project,vendor,csr]);
rows=(await db.query('select * from email_notifications')).rows;
assert.equal(rows.length,4);assert.ok(!JSON.stringify(rows).includes('PRIVATE ACTIVITY'));
await db.exec('delete from email_notifications');
await db.query("insert into approvals(update_id,stage,action,reviewer_user_id,comment) values($1,'admin','reject',$2,'PRIVATE COMMENT')",[update,admin]);
rows=(await db.query('select * from email_notifications')).rows;
assert.equal(rows.length,4);assert.equal(rows[0].event_label,'Activity rejection recorded');assert.ok(!JSON.stringify(rows).includes('PRIVATE COMMENT'));
await db.query("update updates set status='rejected' where id=$1",[update]);
assert.equal((await db.query('select * from email_notifications')).rows.length,4,'approval status does not duplicate emails');
await db.query('delete from project_vendors where project_id=$1',[project]);
await db.query('select * from claim_project_emails(5)');
assert.equal((await db.query("select * from email_notifications where recipient='csr@example.org' and status='cancelled'")).rows.length,1,'removed CSR does not receive queued activity email');
await db.exec('delete from email_notifications');
await db.query("update users set assigned_project_ids='{}' where id=$1",[employee]);
rows=(await db.query('select * from email_notifications')).rows;
assert.equal(rows.length,2);assert.ok(rows.every(r=>r.event_label==='Team assignment changed'));
await db.query('delete from projects where id=$1',[project]);
assert.equal((await db.query('select * from email_notifications')).rows.length,0);
assert.equal((await db.query("select has_function_privilege('anon','public.claim_project_emails(integer)','EXECUTE') as allowed")).rows[0].allowed,false);
await db.close();
console.log('PASS: SQL migration, recipients, no-op suppression, rollback, private content, concurrent claims, retry expiry, approvals, revoked access, assignments and service-role permissions.');
