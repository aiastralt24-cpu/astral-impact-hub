export type Notification = {
  id: string; recipient: string; project_id: string; project_name: string;
  event_label: string; changed_fields: string[]; actor_name?: string | null;
  attempts: number; lease_token: string; request_payload?: EmailPayload | null;
};
export type EmailPayload = { from: string; to: string; subject: string; text: string; html: string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const labels: Record<string,string> = {
  name:'Project name', category:'Project area', sub_category:'Focus area', state:'State', district:'District',
  start_date:'Start date', end_date:'End date', budget_inr:'Budget', reporting_frequency:'Reporting frequency',
  internal_owner_id:'Project manager', project_brief:'Project overview', beneficiary_target:'People to be reached',
  strategic_tags:'Project highlights', emotional_tags:'Impact themes', status:'Status', require_admin_approval:'Approval requirements'
};
export function buildNotificationEmail(row: Notification, from: string, appUrl: string): EmailPayload {
  const origin = new URL(appUrl);
  if (!['https:','http:'].includes(origin.protocol)) throw new Error('Invalid portal URL');
  const url = new URL(`/projects/${encodeURIComponent(row.project_id)}`,origin).href;
  const changed = row.changed_fields.map(key => labels[key]).filter(Boolean);
  const lines = [row.event_label, `Project: ${row.project_name}`, ...(row.actor_name ? [`By: ${row.actor_name}`] : []),
    ...(changed.length ? [`Changed: ${changed.join(', ')}`] : []),
    'Sign in to the portal to review the details available to your account.', url,
    'You received this notification because you are an administrator or are linked to this project.'];
  return {from,to:row.recipient,subject:`Astral Foundation — ${row.event_label}`,
    text:lines.join('\n\n'),html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#121a27;padding:24px"><p style="color:#0059ff;font-weight:bold">ASTRAL FOUNDATION</p><h1 style="font-size:22px">${escapeHtml(row.event_label)}</h1><p><strong>${escapeHtml(row.project_name)}</strong></p>${row.actor_name ? `<p>By: ${escapeHtml(row.actor_name)}</p>`:''}${changed.length ? `<p>Changed: ${escapeHtml(changed.join(', '))}</p>`:''}<p>Sign in to review the details available to your account.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#0059ff;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">View project</a></p><p style="font-size:12px;color:#64748b">You received this notification because you are an administrator or are linked to this project.</p></div>`};
}
export function retryDelaySeconds(attempt: number) { return Math.min(3600,60 * 2 ** Math.max(0,attempt-1)); }
export function retryableStatus(status: number) { return status===408 || status===429 || status>=500; }
