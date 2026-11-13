import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotificationEmail, retryableStatus, retryDelaySeconds, type Notification } from '../lib/notifications/message';
import { sendNotification } from '../lib/notifications/worker';
const row: Notification={id:'event-1',recipient:'person@example.org',project_id:'project-1',project_name:'<script>private & name</script>',event_label:'Project details updated',changed_fields:['project_brief','password','status'],actor_name:'A & B',attempts:1,lease_token:'lease'};
test('notification escapes HTML, links to the project and includes only known field names',()=>{
 const email=buildNotificationEmail(row,'Astral <updates@example.org>','https://portal.example.org');
 assert.equal(email.to,'person@example.org');
 assert.ok(email.html.includes('&lt;script&gt;'));
 assert.ok(!email.html.includes('<script>'));
 assert.ok(email.text.includes('Project overview, Status'));
 assert.ok(!email.text.includes('password'));
 assert.ok(email.html.includes('https://portal.example.org/projects/project-1'));
 assert.ok(!email.subject.includes(row.project_name));
});
test('invalid portal schemes are rejected',()=>assert.throws(()=>buildNotificationEmail(row,'a@b.org','javascript:alert(1)')));
test('retry policy is bounded and excludes permanent provider errors',()=>{
 assert.equal(retryDelaySeconds(1),60);assert.equal(retryDelaySeconds(8),3600);
 for(const code of [408,429,500,503]) assert.ok(retryableStatus(code));
 for(const code of [400,401,403,422]) assert.ok(!retryableStatus(code));
});
test('provider retries retain recipient, payload and idempotency key',async()=>{
 const calls: RequestInit[]=[];
 const fake=async (_url: string | URL | Request, init?: RequestInit)=>{calls.push(init!);return new Response(JSON.stringify({id:'provider-id'}),{status:200});};
 const payload=buildNotificationEmail(row,'a@example.org','https://portal.example.org');
 const result=await sendNotification(payload,row.id,'test-key',fake);
 await sendNotification(payload,row.id,'test-key',fake);
 assert.equal(result.ok,true);assert.equal(result.id,'provider-id');
 assert.equal(calls[0].body,calls[1].body);
 assert.equal((calls[0].headers as Record<string,string>)['Idempotency-Key'],'project-notification/event-1');
 assert.equal(JSON.parse(String(calls[0].body)).to,row.recipient);
});
test('provider rejection and rate limiting are not reported as acceptance',async()=>{
 for(const status of [403,429,503]) {
  const result=await sendNotification(buildNotificationEmail(row,'a@example.org','https://portal.example.org'),row.id,'test',async()=>new Response('{}',{status}));
  assert.equal(result.ok,false);assert.equal(result.retry,status!==403);
 }
});

test('cron refuses absent or invalid authorization without processing emails',async()=>{
 const {GET}=await import('../app/api/cron/email-notifications/route');
 const original=process.env.CRON_SECRET;
 try {
  delete process.env.CRON_SECRET;
  assert.equal((await GET(new Request('https://portal.example.org/api/cron/email-notifications'))).status,401);
  process.env.CRON_SECRET='test-secret';
  assert.equal((await GET(new Request('https://portal.example.org/api/cron/email-notifications',{headers:{authorization:'Bearer wrong'}}))).status,401);
 } finally { if(original===undefined) delete process.env.CRON_SECRET;else process.env.CRON_SECRET=original; }
});
