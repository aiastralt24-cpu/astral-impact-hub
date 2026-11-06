import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Users, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { createProjectAction } from "@/features/projects/actions";
import { ProjectManagementChoice } from "@/features/projects/project-management-choice";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { AppUser, VendorRecord } from "@/types/domain";

const control = "w-full min-w-0 h-11 rounded-xl px-3.5 text-sm transition-shadow";
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-sm font-medium"><span>{label}{required ? <span className="ml-1 text-[var(--primary)]">*</span> : <span className="ml-2 text-xs font-normal text-[var(--gray-mid)]">Optional</span>}</span>{children}</label>;
}
function Section({ number, title, description, icon, children }: { number: string; title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_3px_16px_rgba(18,26,39,0.025)] sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">{icon}</span><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gray-mid)]">Section {number}</p><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-5 text-[var(--gray-mid)]">{description}</p></div></div><div className="grid gap-5">{children}</div></section>;
}

export function CreateProjectForm({ vendors, managers, defaultVendorIds }: { vendors: VendorRecord[]; managers: AppUser[]; defaultVendorIds?: string[] }) {
  return <form action={createProjectAction} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="grid min-w-0 gap-5">
      <Section number="01" title="Project details" description="Give your initiative a name and a clear purpose." icon={<ClipboardList size={19} />}>
        <Field label="Project name" required><input name="name" placeholder="e.g. School Water Programme" required className={control} /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Project area" required><input name="category" placeholder="e.g. Education" required className={control} /></Field><Field label="Focus area"><input name="subCategory" placeholder="e.g. School infrastructure" className={control} /></Field></div>
        <Field label="Project overview" required><textarea name="projectBrief" placeholder="Describe what the project will do, who it will support, and the change you hope to make." required className="min-h-28 w-full resize-y rounded-xl px-3.5 py-3 text-sm leading-6" /></Field>
      </Section>
      <Section number="02" title="Location & timeline" description="Set where the work happens and when it runs." icon={<MapPin size={19} />}>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="State" required><input name="state" placeholder="Enter state" required className={control} /></Field><Field label="District" required><input name="district" placeholder="Enter district" required className={control} /></Field><Field label="Start date" required><input name="startDate" type="date" required className={control} /></Field><Field label="End date" required><input name="endDate" type="date" required className={control} /></Field></div>
      </Section>
      <Section number="03" title="Ownership & delivery" description="Choose who will lead and deliver this project." icon={<Users size={19} />}>
        <Field label="Project manager" required><select name="internalOwnerId" required className={control}>{managers.map(manager => <option key={manager.id} value={manager.id}>{manager.fullName}</option>)}</select></Field>
        <ProjectManagementChoice vendors={vendors} defaultVendorIds={defaultVendorIds} />
      </Section>
      <details className="group rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7"><summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">Additional impact details <span className="ml-2 text-xs font-normal text-[var(--gray-mid)]">Optional</span></summary><p className="mt-2 text-sm text-[var(--gray-mid)]">Add more context now, or return to it later.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Project highlights"><input name="strategicTags" placeholder="Separate items with commas" className={control} /></Field><Field label="Impact themes"><input name="emotionalTags" placeholder="Separate items with commas" className={control} /></Field><Field label="People to be reached"><input name="beneficiaryTarget" type="number" min="0" placeholder="0" className={control} /></Field></div></details>
    </div>
    <aside className="min-w-0"><div className="rounded-2xl border border-[var(--border)] bg-white p-6 xl:sticky xl:top-6"><div className="mb-5 flex items-center gap-2"><Settings2 size={17} className="text-[var(--primary)]" /><h2 className="font-display font-bold">Project setup</h2></div><Field label="Project status" required><select name="status" className={control}><option value="draft">Draft</option><option value="active">Active</option><option value="on_hold">On Hold</option></select></Field><p className="mt-2 text-xs leading-5 text-[var(--gray-mid)]">Use Draft while you prepare the details. Choose Active when the project is ready to begin.</p><label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-[var(--border)] pt-5"><input type="checkbox" name="requireAdminApproval" className="mt-1 size-4 shrink-0" /><span className="text-sm font-medium">Require admin approval<span className="mt-1 block text-xs font-normal leading-5 text-[var(--gray-mid)]">Project updates will need admin review.</span></span></label><div className="mt-6 border-t border-[var(--border)] pt-5"><p className="mb-4 text-xs leading-5 text-[var(--gray-mid)]">Fields marked <span className="font-bold text-[var(--primary)]">*</span> are required. You can edit project details after creating it.</p><ConfirmSubmitButton confirmMessage="Create this project?" pendingLabel="Creating..." className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">Create project <ArrowRight size={16} /></ConfirmSubmitButton><Link href="/projects" className="mt-2 flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-[var(--gray-mid)] transition-colors hover:bg-slate-50">Cancel</Link></div></div></aside>
  </form>;
}
