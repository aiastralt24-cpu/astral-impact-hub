import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildNotificationEmail, retryableStatus, retryDelaySeconds, type Notification, type EmailPayload } from "./message";

export function notificationConfig() {
  const enabled=process.env.EMAIL_NOTIFICATIONS_ENABLED==='true';
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=process.env.EMAIL_FROM?.trim();
  const appUrl=process.env.NEXT_PUBLIC_APP_URL?.trim();
  // Preview deployments must never deliver production notifications.
  if (!enabled || (process.env.VERCEL_ENV && process.env.VERCEL_ENV!=='production')) return null;
  if (!apiKey || !from || !appUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Notifications enabled but email/database configuration is incomplete.');
  const url=new URL(appUrl);
  if (url.protocol!=='https:' && process.env.NODE_ENV==='production') throw new Error('Email portal URL must use HTTPS');
  return {apiKey,from,appUrl};
}

export async function sendNotification(payload: EmailPayload, id: string, apiKey: string, send: typeof fetch = fetch) {
  const response=await send('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`project-notification/${id}`},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)
  });
  const body=await response.json().catch(()=>({})) as { id?: string };
  return {ok:response.ok && Boolean(body.id),id:body.id,retry:retryableStatus(response.status),status:response.status};
}

export async function dispatchProjectEmails() {
  const config=notificationConfig();
  if (!config) return {enabled:false,accepted:0,failed:0};
  const db=createServiceRoleClient();
  let accepted=0,failed=0;
  const deadline=Date.now()+40_000;
  while (Date.now()<deadline) {
    const {data,error}=await db.rpc('claim_project_emails',{p_limit:1});
    if (error) throw new Error(`Email queue unavailable (${error.code}); apply migration 0007.`);
    const row=(data as Notification[] | null)?.[0];
    if (!row) break;
    // Stay below the default provider request rate within this worker.
    await new Promise(resolve=>setTimeout(resolve,600));
    const finish=async (values: Record<string,unknown>) => {
      const {error:e}=await db.from('email_notifications').update({...values,lease_until:null,lease_token:null}).eq('id',row.id).eq('lease_token',row.lease_token);
      if(e) throw new Error('Email delivery status could not be persisted; lease recovery will use the same idempotency key.');
    };
    // Freeze sender/content before the first HTTP request, so retries are identical
    // even after environment changes or template deployments.
    const payload=row.request_payload || buildNotificationEmail(row,config.from,config.appUrl);
    if (!row.request_payload) {
      const {data:saved,error:e}=await db.from('email_notifications').update({request_payload:payload}).eq('id',row.id).eq('lease_token',row.lease_token).select('id');
      if(e || !saved?.length) throw new Error('Could not persist email payload; nothing was sent.');
    }
    let result: Awaited<ReturnType<typeof sendNotification>>;
    try { result=await sendNotification(payload,row.id,config.apiKey); }
    catch {
      await finish({status:row.attempts>=8?'failed':'pending',available_at:new Date(Date.now()+retryDelaySeconds(row.attempts)*1000).toISOString(),last_error:'Provider connection interrupted; retry uses the same idempotency key.'});
      failed++; continue;
    }
    if(result.ok) {
      await finish({status:'accepted',provider_id:result.id,accepted_at:new Date().toISOString(),last_error:null}); accepted++;
    } else {
      await finish({status:result.retry && row.attempts<8?'pending':'failed',available_at:new Date(Date.now()+retryDelaySeconds(row.attempts)*1000).toISOString(),last_error:`Resend HTTP ${result.status}; inspect provider logs.`}); failed++;
    }
  }
  return {enabled:true,accepted,failed};
}
