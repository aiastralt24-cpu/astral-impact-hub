export type Notification = {
  id: string; recipient: string; project_id: string; project_name: string;
  event_label: string; changed_fields: string[]; actor_name?: string | null;
  recipient_name?: string | null; context_name?: string | null;
  attempts: number; lease_token: string; request_payload?: EmailPayload | null;
};
export type EmailPayload = { from: string; to: string; subject: string; text: string; html: string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const labels: Record<string,string> = {
  name:'project name', category:'project area', sub_category:'focus area', state:'state', district:'district',
  start_date:'start date', end_date:'end date', budget_inr:'budget', reporting_frequency:'reporting schedule',
  internal_owner_id:'project manager', project_brief:'project overview', beneficiary_target:'target reach',
  strategic_tags:'project highlights', emotional_tags:'impact themes', status:'status', require_admin_approval:'approval settings'
};

type EmailCopy = { subject: string; message: string; button: string };
function emailCopy(row: Notification, changed: string[]): EmailCopy {
  const project = row.project_name;
  const actor = row.actor_name;
  const context = row.context_name;
  switch (row.event_label) {
    case 'Project created':
      return { subject:`A new project is ready: ${project}`, message:actor ? `${actor} added ${project} to the portal. You can now review the details and follow its progress.` : `A new project, ${project}, has been added to the portal. You can now review the details and follow its progress.`, button:'View project' };
    case 'Project details updated':
      return { subject:`${project} has been updated`, message:`${row.actor_name ? `${row.actor_name} updated ${project}` : `Some details for ${project} have changed`}${changed.length ? `, including ${changed.join(', ')}` : ''}. Visit the project to see the latest information.`, button:'Review project' };
    case 'CSR assignment changed':
      return { subject:`A CSR team update for ${project}`, message:`The partner organisations connected with ${project} have changed. Visit the project to see the current team.`, button:'View project' };
    case 'CSR organisation joined':
      return { subject:`${context || 'A partner organisation'} joined ${project}`, message:`${context || 'A partner organisation'} is now connected with ${project}. The project team can coordinate and follow progress in the portal.`, button:'View project' };
    case 'CSR organisation unlinked':
      return { subject:`A team change for ${project}`, message:`${context || 'A partner organisation'} is no longer connected with ${project}. Visit the project to see its current team.`, button:'View project' };
    case 'Activity update submitted':
      return { subject:`A new progress update for ${project}`, message:actor ? `${actor} shared a progress update for ${project}. It’s ready for you to review.` : `A progress update for ${project} has been shared. It’s ready for you to review.`, button:'Review update' };
    case 'Activity details updated':
      return { subject:`A progress update was revised for ${project}`, message:`Some details in a progress update for ${project} have changed. Visit the portal to review the latest version.`, button:'Review update' };
    case 'Activity approval recorded':
      return { subject:`An update for ${project} was approved`, message:actor ? `${actor} approved an update for ${project}. You can view the project for the latest progress.` : `An update for ${project} was approved. You can view the project for the latest progress.`, button:'View project' };
    case 'Activity rejection recorded':
      return { subject:`An update needs attention for ${project}`, message:`${actor ? `${actor} reviewed an update` : `An update`} for ${project} was not approved. Sign in to review the decision and next steps.`, button:'Review decision' };
    case 'Activity revision requested':
      return { subject:`Changes were requested for ${project}`, message:`${actor ? `${actor} requested changes` : 'Changes were requested'} to an update for ${project}. Sign in to review the feedback and next steps.`, button:'Review request' };
    case 'Activity escalated for review':
      return { subject:`An update for ${project} needs additional review`, message:`An update for ${project} has been sent for additional review${row.actor_name ? ` by ${row.actor_name}` : ''}. You can follow its progress in the portal.`, button:'View project' };
    case 'Team assignment changed':
      return { subject:`The project team has changed: ${project}`, message:`${actor ? `${actor} updated the team` : 'The team has changed'}${context ? `, including access for ${context}` : ''} on ${project}. Visit the project to see who is currently involved.`, button:'View team' };
    case 'Team member assigned':
      return { subject:`A new team member joined ${project}`, message:`${context || 'A team member'} has been added to ${project}${actor ? ` by ${actor}` : ''}. You can view the current project team in the portal.`, button:'View team' };
    default:
      return { subject:`A project update for ${project}`, message:`There’s a new update for ${project}. Visit the portal to review the latest information.`, button:'View project' };
  }
}

export function buildNotificationEmail(row: Notification, from: string, appUrl: string): EmailPayload {
  const origin = new URL(appUrl);
  if (!['https:','http:'].includes(origin.protocol)) throw new Error('Invalid portal URL');
  const url = new URL(`/projects/${encodeURIComponent(row.project_id)}`,origin).href;
  const changed = row.changed_fields.map(key => labels[key]).filter(Boolean);
  const copy = emailCopy(row, changed);
  const firstName = row.recipient_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const footer = 'You’re receiving this because you’re an administrator or part of this project team.';
  const text = [greeting, copy.message, `${copy.button}: ${url}`, 'Thank you,', 'Astral Foundation', footer].join('\n\n');
  return {from,to:row.recipient,subject:copy.subject,
    text,html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033;padding:32px 24px;line-height:1.6"><p style="color:#0059ff;font-size:13px;font-weight:700;letter-spacing:.08em">ASTRAL FOUNDATION</p><p>${escapeHtml(greeting)}</p><p>${escapeHtml(copy.message)}</p><p style="margin:28px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#0059ff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(copy.button)}</a></p><p>Thank you,<br><strong>Astral Foundation</strong></p><p style="font-size:12px;color:#64748b;margin-top:28px">${escapeHtml(footer)}</p></div>`};
}
export function retryDelaySeconds(attempt: number) { return Math.min(3600,60 * 2 ** Math.max(0,attempt-1)); }
export function retryableStatus(status: number) { return status===408 || status===429 || status>=500; }
