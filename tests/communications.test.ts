import test, {after, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const originalCwd=process.cwd();
const sandbox=mkdtempSync(join(tmpdir(),'astral-communications-'));
process.chdir(sandbox);
process.env.NODE_ENV='development';
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
const {generateDraft,editDraft,reviewDraft,shareDraft}=await import(pathToFileURL(join(originalCwd,'lib/communications/service.ts')).href);
const {AnthropicContentProvider}=await import(pathToFileURL(join(originalCwd,'lib/ai/provider.ts')).href);
const {sendToChannel}=await import(pathToFileURL(join(originalCwd,'lib/communications/transport.ts')).href);
const {sourceHash}=await import(pathToFileURL(join(originalCwd,'lib/communications/source.ts')).href);
const {recordWhatsAppStatus}=await import(pathToFileURL(join(originalCwd,'lib/communications/repository.ts')).href);
const originalFetch=globalThis.fetch;
const user={id:'u1',role:'admin',isSuperAdmin:true,fullName:'Admin',username:'admin',assignedVendorIds:[],assignedProjectIds:[]};
const project={id:'p1',name:'Water project',projectBrief:'Repair a water point.',vendorIds:[],vendorName:'Managed internally',emotionalTags:[],strategicTags:[],healthScore:0,readinessScore:0,status:'active'};
const update={id:'up1',projectId:'p1',projectName:'Water project',vendorId:'',vendorName:'Foundation',submittedByUserId:'u1',happenedAt:'2026-11-06',description:'Repaired two water points.',progressPercent:50,media:[],status:'approved',readinessScore:30,createdAt:'2026-11-06T10:00:00Z'};
const draft={emotionalHook:'Two water points repaired.',instagramCaptionShort:'Two water points repaired.',instagramCaptionLong:'The team repaired two water points.',telegramUpdate:'Two water points repaired.',whatsappDigest:'Two water points repaired.',reelScript:'Show the repaired water points.',carouselBreakdown:['Two water points repaired'],csrSummary:'Repair of two water points completed.'};
function db() {return globalThis.__astralDemoDb;}
function seedContent(status='draft') { const content={...draft,id:'c1',updateId:'up1',projectName:'Water project',vendorName:'Foundation',createdAt:'2026-11-06',workflow:{revision:1,status,sourceHash:sourceHash(project,update),editedBy:'u1',updatedAt:'2026-11-06',...(status==='approved'?{approvedBy:'u1',approvedAt:'2026-11-06'}:{})}};db().generatedContent=[content];return content; }
beforeEach(()=>{
  globalThis.fetch=originalFetch;
  globalThis.__astralDemoDb=structuredClone({users:[user],projects:[project],updates:[update],vendors:[],approvals:[],generatedContent:[],distributionLog:[]});
  for(const name of ['ANTHROPIC_API_KEY','ANTHROPIC_MODEL','TELEGRAM_BOT_TOKEN','TELEGRAM_CHANNEL_ID','WHATSAPP_API_TOKEN','WHATSAPP_PHONE_NUMBER_ID','INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_ACCOUNT_ID','META_GRAPH_VERSION']) delete process.env[name];
});
after(()=>{globalThis.fetch=originalFetch;process.chdir(originalCwd);rmSync(sandbox,{recursive:true,force:true});});
function telegram() {process.env.TELEGRAM_BOT_TOKEN='test-token';process.env.TELEGRAM_CHANNEL_ID='test-channel';}
function ai() {process.env.ANTHROPIC_API_KEY='test-key';process.env.ANTHROPIC_MODEL='test-model';}
function reply(value,status=200) {return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});}

test('missing AI configuration never persists placeholder content',async()=>{await assert.rejects(()=>generateDraft(user,'up1',0),/not connected/);assert.equal(db().generatedContent.length,0);});
test('invalid AI JSON and truncation leave the existing draft unchanged',async()=>{ai();const saved=seedContent();for(const response of [{stop_reason:'end_turn',content:[{type:'text',text:'not json'}]},{stop_reason:'max_tokens',content:[{type:'text',text:JSON.stringify(draft)}]}]) {globalThis.fetch=async()=>reply(response);await assert.rejects(()=>generateDraft(user,'up1',1),/incomplete or invalid/);assert.deepEqual(db().generatedContent[0],saved);}});
test('successful AI request saves a real unapproved version and omits user identifiers',async()=>{ai();globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init.body);assert.ok(!body.messages[0].content.includes('submittedByUserId'));return reply({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(draft)}]});};await generateDraft(user,'up1',0);assert.equal(db().generatedContent[0].workflow.status,'draft');assert.equal(db().generatedContent[0].workflow.revision,1);});
test('AI provider reports authentication failure without saving a draft',async()=>{ai();globalThis.fetch=async()=>reply({},401);await assert.rejects(()=>generateDraft(user,'up1',0),/credentials were rejected/);assert.equal(db().generatedContent.length,0);});
test('saving edits revokes approval and stale versions cannot overwrite',async()=>{seedContent('approved');await editDraft(user,'up1',1,{...draft,emotionalHook:'Repaired water points.'},'');assert.equal(db().generatedContent[0].workflow.status,'draft');assert.equal(db().generatedContent[0].workflow.approvedBy,undefined);await assert.rejects(()=>editDraft(user,'up1',1,draft,''),/another session/);});
test('review requires submission, administrator approval and unchanged source',async()=>{seedContent();await assert.rejects(()=>reviewDraft(user,'up1',1,'approve',''),/Submit this draft/);await reviewDraft(user,'up1',1,'submit','');await assert.rejects(()=>reviewDraft({...user,role:'content_team'},'up1',2,'approve',''),/Only an administrator/);db().updates[0].description='Changed facts';await assert.rejects(()=>reviewDraft(user,'up1',2,'approve',''),/has changed/);});
test('unapproved, sensitive and changed-source content cannot be sent',async()=>{telegram();seedContent();await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/approved/);seedContent('approved');db().updates[0].sensitiveContent=true;await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/sensitive/);db().updates[0].sensitiveContent=false;db().updates[0].description='Changed';await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/changed after approval/);});
test('missing channel credentials cause no delivery attempt',async()=>{seedContent('approved');await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/not connected/);assert.equal(db().distributionLog.length,0);});
test('Telegram receipt is recorded and duplicate delivery is blocked',async()=>{telegram();seedContent('approved');let calls=0;globalThis.fetch=async()=>{calls++;return reply({ok:true,result:{message_id:42}});};await shareDraft(user,'up1','c1',1,'telegram');assert.equal(db().distributionLog[0].providerMessageId,'42');assert.equal(db().distributionLog[0].status,'sent');await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/already been sent/);assert.equal(calls,1);});
test('concurrent duplicate clicks result in only one outbound request',async()=>{telegram();seedContent('approved');let calls=0;globalThis.fetch=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,15));return reply({ok:true,result:{message_id:5}});};const results=await Promise.allSettled([shareDraft(user,'up1','c1',1,'telegram'),shareDraft(user,'up1','c1',1,'telegram')]);assert.equal(calls,1);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);});
test('lost provider response is unknown and blocks resend and editing',async()=>{telegram();seedContent('approved');globalThis.fetch=async()=>{throw new Error('timeout');};await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/response was lost/);assert.equal(db().distributionLog[0].status,'unknown');await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/already been sent/);await assert.rejects(()=>editDraft(user,'up1',1,draft,''),/reconciliation/);});
test('definitive rejection is failed rather than sent',async()=>{telegram();seedContent('approved');globalThis.fetch=async()=>reply({ok:false,error_code:403},403);await assert.rejects(()=>shareDraft(user,'up1','c1',1,'telegram'),/credentials or publishing permissions/);assert.equal(db().distributionLog[0].status,'failed');assert.equal(db().distributionLog[0].providerMessageId,undefined);});
test('WhatsApp receipt is accepted, then webhooks advance status without regression',async()=>{process.env.WHATSAPP_API_TOKEN='token';process.env.WHATSAPP_PHONE_NUMBER_ID='phone';process.env.META_GRAPH_VERSION='v25.0';seedContent('approved');globalThis.fetch=async()=>reply({messages:[{id:'wamid.test'}]});await shareDraft(user,'up1','c1',1,'whatsapp','+919876543210');assert.equal(db().distributionLog[0].status,'accepted');await recordWhatsAppStatus('wamid.test','delivered');await recordWhatsAppStatus('wamid.test','sent');assert.equal(db().distributionLog[0].status,'delivered');});
test('Instagram creates, checks and publishes the image before reporting success',async()=>{process.env.INSTAGRAM_ACCESS_TOKEN='token';process.env.INSTAGRAM_ACCOUNT_ID='account';process.env.META_GRAPH_VERSION='v25.0';const urls=[];globalThis.fetch=async(url)=>{urls.push(url);return reply(url.endsWith('/media')?{id:'container'}:url.includes('status_code')?{status_code:'FINISHED'}:{id:'published-media'});};const receipt=await sendToChannel('instagram',seedContent('approved'),'account','https://example.org/photo.jpg');assert.equal(receipt.id,'published-media');assert.equal(urls.length,3);assert.ok(urls[2].endsWith('/media_publish'));});

test('WhatsApp delivery webhook rejects forged signatures',async()=>{
  process.env.META_APP_SECRET='test-secret';
  const {POST}=await import(pathToFileURL(join(originalCwd,'app/api/webhooks/whatsapp/route.ts')).href);
  const response=await POST(new Request('http://localhost/api/webhooks/whatsapp',{method:'POST',body:'{}',headers:{'x-hub-signature-256':'sha256=forged'}}));
  assert.equal(response.status,401);
});
test('signed WhatsApp webhook advances the matching channel receipt',async()=>{
  const {createHmac}=await import('node:crypto');
  process.env.META_APP_SECRET='test-secret';process.env.WHATSAPP_PHONE_NUMBER_ID='phone';
  db().distributionLog=[{id:'l1',channel:'whatsapp',status:'accepted',providerMessageId:'wamid.webhook'}];
  const raw=JSON.stringify({entry:[{changes:[{value:{metadata:{phone_number_id:'phone'},statuses:[{id:'wamid.webhook',status:'delivered'}]}}]}]});
  const {POST}=await import(pathToFileURL(join(originalCwd,'app/api/webhooks/whatsapp/route.ts')).href);
  const response=await POST(new Request('http://localhost/api/webhooks/whatsapp',{method:'POST',body:raw,headers:{'x-hub-signature-256':`sha256=${createHmac('sha256','test-secret').update(raw).digest('hex')}`}}));
  assert.equal(response.status,200);assert.equal(db().distributionLog[0].status,'delivered');
});
