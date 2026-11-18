import { Drawer } from "@/components/ui/drawer";
import { createVendorAction, deleteVendorAction, updateVendorAction, updateVendorCredentialsAction } from "@/features/vendors/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { AppUser, VendorRecord } from "@/types/domain";
import Link from "next/link";
import { ArrowUpRight, Building2, FolderKanban, MapPin, MessageCircle, UsersRound } from "lucide-react";

type VendorManagementProps = {
  vendors: VendorRecord[];
  session: AppUser;
  showSummary?: boolean;
  showCreate?: boolean;
  linkedUser?: AppUser;
};

export function VendorManagement({ vendors, session, showSummary = true, showCreate = true, linkedUser }: VendorManagementProps) {
  const canManageVendors = session.role !== "vendor";
  const canDeleteVendors = Boolean(session.isSuperAdmin || session.role === "admin");

  return (
    <div className="space-y-6">
      {showSummary ? <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--primary)]"><UsersRound className="h-5 w-5" /></span><div><p className="text-xs text-[var(--gray-mid)]">Active associates</p><p className="font-display text-lg font-semibold">{vendors.length}</p></div></div></div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FolderKanban className="h-5 w-5" /></span><div><p className="text-xs text-[var(--gray-mid)]">Project assignments</p><p className="font-display text-lg font-semibold">{vendors.reduce((total, vendor) => total + vendor.assignedProjectIds.length, 0)}</p></div></div></div>
      </section> : null}

      <div className={vendors.length > 0 && showCreate ? "grid gap-6 xl:grid-cols-[1.35fr_0.95fr]" : "grid w-full gap-6"}>
        <div className={vendors.length === 1 ? "grid gap-4" : "grid gap-4 xl:grid-cols-2"}>
        {vendors.map((vendor) => (
          <div key={vendor.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><Link href={`/vendors/${vendor.id}`} className="font-display text-xl font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">{vendor.name}</Link><p className="mt-1 text-sm text-[var(--gray-mid)]">{vendor.primaryContactName !== vendor.whatsappPhone ? vendor.primaryContactName : ""}</p></div><Link href={`/vendors/${vendor.id}`} aria-label={`Open ${vendor.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--primary)]"><ArrowUpRight className="h-4 w-4" /></Link></div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--gray-mid)]"><MessageCircle className="h-4 w-4" /><span className="text-[var(--foreground)]">{vendor.whatsappPhone || "WhatsApp not added"}</span></div>
              <div className="flex items-center gap-2 text-[var(--gray-mid)]"><MapPin className="h-4 w-4" /><span className="line-clamp-1 text-[var(--foreground)]">{vendor.geographicalScope.join(", ") || "Coverage not added"}</span></div>
              <div className="flex items-center gap-2 text-[var(--gray-mid)]"><FolderKanban className="h-4 w-4" /><span className="text-[var(--foreground)]">{vendor.assignedProjectIds.length} assigned {vendor.assignedProjectIds.length === 1 ? "project" : "projects"}</span></div>
            </div>
            {vendor.instagramHandle || vendor.facebookHandle ? (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {vendor.instagramHandle ? <p><span className="text-[var(--gray-mid)]">Instagram:</span> <span className="font-medium text-[var(--foreground)]">{vendor.instagramHandle}</span></p> : null}
                {vendor.facebookHandle ? <p><span className="text-[var(--gray-mid)]">Facebook:</span> <span className="font-medium text-[var(--foreground)]">{vendor.facebookHandle}</span></p> : null}
              </div>
            ) : null}

            {linkedUser ? (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#f8f9fc] p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">CSR Associate login</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-[var(--border)]"><p className="text-xs text-[var(--gray-mid)]">User ID</p><p className="mt-1 font-medium text-[var(--foreground)]">{linkedUser.username}</p></div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--primary)]">Change user ID or reset password</summary>
                  <form action={updateVendorCredentialsAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="userId" value={linkedUser.id} />
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <input name="username" defaultValue={linkedUser.username} required aria-label="User ID" className="h-11 rounded-2xl px-4" />
                    <input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="New temporary password" aria-label="New temporary password" className="h-11 rounded-2xl px-4" />
                    <p className="text-xs leading-5 text-[var(--gray-mid)] sm:col-span-2">Passwords cannot be viewed after creation. Leave this blank to keep the current password.</p>
                    <ConfirmSubmitButton pendingLabel="Saving..." className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white sm:col-span-2 sm:w-fit">Save login details</ConfirmSubmitButton>
                  </form>
                </details>
              </div>
            ) : null}

            {canManageVendors ? (
              <Drawer title="Edit CSR Associate" trigger="Edit associate">
                <form action={updateVendorAction} className="mt-4 grid gap-4">
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <label className="grid gap-1.5 text-sm font-medium"><span>CSR Associate name</span><input name="name" defaultValue={vendor.name} placeholder="CSR Associate name" className="h-12 rounded-2xl px-4" /></label>
                  <label className="grid gap-1.5 text-sm font-medium"><span>Primary contact</span><input name="primaryContactName" defaultValue={vendor.primaryContactName} placeholder="Primary contact" className="h-12 rounded-2xl px-4" /></label>
                  <label className="grid gap-1.5 text-sm font-medium"><span>Email</span><input name="email" defaultValue={vendor.email} placeholder="Email" className="h-12 rounded-2xl px-4" /></label>
                  <label className="grid gap-1.5 text-sm font-medium"><span>WhatsApp phone</span><input name="whatsappPhone" defaultValue={vendor.whatsappPhone} placeholder="WhatsApp phone" className="h-12 rounded-2xl px-4" /></label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-medium"><span>Instagram handle or URL (optional)</span><input name="instagramHandle" defaultValue={vendor.instagramHandle} placeholder="Instagram handle or URL (optional)" className="h-12 rounded-2xl px-4" /></label>
                    <label className="grid gap-1.5 text-sm font-medium"><span>Facebook page or URL (optional)</span><input name="facebookHandle" defaultValue={vendor.facebookHandle} placeholder="Facebook page or URL (optional)" className="h-12 rounded-2xl px-4" /></label>
                  </div>
                  <label className="grid gap-1.5 text-sm font-medium"><span>Organization type</span><input name="organizationType" defaultValue={vendor.organizationType} placeholder="Organization type" className="h-12 rounded-2xl px-4" /></label>
                  <label className="grid gap-1.5 text-sm font-medium"><span>States, comma separated</span><input name="geographicalScope" defaultValue={vendor.geographicalScope.join(", ")} placeholder="States, comma separated" className="h-12 rounded-2xl px-4" /></label>
                  <label className="grid gap-1.5 text-sm font-medium"><span>Notes</span><textarea name="notes" defaultValue={vendor.notes} placeholder="Notes" className="min-h-28 rounded-xl px-4 py-3" /></label>
                  <div className="flex flex-wrap gap-3">
                    <ConfirmSubmitButton
                      confirmMessage={`Save changes for ${vendor.name}?`}
                      pendingLabel="Saving..."
                      className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-sm"
                    >
                      Save CSR Associate
                    </ConfirmSubmitButton>
                  </div>
                </form>

                {canDeleteVendors ? (
                  <form action={deleteVendorAction} className="mt-3">
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Delete ${vendor.name}? This cannot be undone.`}
                      pendingLabel="Deleting..."
                      className="rounded-lg border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                    >
                      Delete CSR Associate
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </Drawer>
            ) : null}
          </div>
        ))}
        </div>

        {canManageVendors && showCreate ? (
        <form action={createVendorAction} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[var(--primary)]"><Building2 className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-semibold">Organization details</h2><p className="text-sm text-[var(--gray-mid)]">Fields marked required are needed to create the profile.</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Organization name <input required name="name" placeholder="e.g. Earth Focus Foundation" className="h-12 rounded-xl px-4 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Primary contact <input required name="primaryContactName" placeholder="Full name" className="h-12 rounded-xl px-4 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">WhatsApp phone <input name="whatsappPhone" placeholder="Phone number" className="h-12 rounded-xl px-4 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Email <input type="email" name="email" placeholder="contact@organization.org" className="h-12 rounded-xl px-4 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Organization type <input name="organizationType" placeholder="NGO, trust, foundation..." className="h-12 rounded-xl px-4 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Coverage areas <input name="geographicalScope" placeholder="States or regions, comma separated" className="h-12 rounded-xl px-4 font-normal" /></label>
          <details className="rounded-xl border border-[var(--border)] bg-[#f8f9fc] p-4 sm:col-span-2"><summary className="cursor-pointer text-sm font-semibold">Social profiles and portal login <span className="font-normal text-[var(--gray-mid)]">(optional)</span></summary>
          <div className="mt-4 rounded-xl border-t border-[var(--border)] pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium"><span>Instagram handle or URL</span><input name="instagramHandle" placeholder="Instagram handle or URL" className="h-12 rounded-xl px-4" /></label>
              <label className="grid gap-1.5 text-sm font-medium"><span>Facebook page or URL</span><input name="facebookHandle" placeholder="Facebook page or URL" className="h-12 rounded-xl px-4" /></label>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--foreground)]">Optional CSR Associate login</p>
            <p className="mt-1 text-xs text-[var(--gray-mid)]">Create credentials only when this associate needs portal access.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium"><span>User ID</span><input name="username" placeholder="User ID" className="h-12 rounded-xl px-4" /></label>
              <label className="grid gap-1.5 text-sm font-medium"><span>Temporary password</span><input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="At least 10 characters" className="h-12 rounded-xl px-4" /></label>
            </div>
          </div></details>
          <label className="grid gap-1.5 text-sm font-medium"><span>Internal notes (optional)</span><textarea name="notes" placeholder="Internal notes (optional)" className="min-h-24 rounded-xl px-4 py-3 sm:col-span-2" /></label>
          <ConfirmSubmitButton
            confirmMessage="Create this CSR Associate?"
            pendingLabel="Creating..."
            className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm sm:col-span-2 sm:justify-self-end"
          >
            Create CSR Associate
          </ConfirmSubmitButton>
        </div>
        </form>
        ) : null}
      </div>
    </div>
  );
}
