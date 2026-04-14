import { createVendorAction, deleteVendorAction, updateVendorAction } from "@/features/vendors/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { AppUser, VendorRecord } from "@/types/domain";

type VendorManagementProps = {
  vendors: VendorRecord[];
  session: AppUser;
};

export function VendorManagement({ vendors, session }: VendorManagementProps) {
  const averageScore = Math.round(vendors.reduce((sum, vendor) => sum + vendor.score, 0) / Math.max(vendors.length, 1));
  const canManageVendors = session.role !== "vendor";
  const canDeleteVendors = Boolean(session.isSuperAdmin || session.role === "admin");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Active vendor partners</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{vendors.length}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Partners available across current projects</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Average score</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{averageScore}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Overall reliability across reporting and quality</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Needs follow-up</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{vendors.filter((vendor) => vendor.score < 70).length}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Partners that need closer support this cycle</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-4">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="glass-card rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-black text-[var(--foreground)]">{vendor.name}</h3>
                <p className="mt-1 text-sm text-[var(--gray-mid)]">{vendor.primaryContactName}</p>
              </div>
              <div className={`rounded-full px-3 py-2 text-sm font-semibold ring-1 ${vendor.score >= 70 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                Score {vendor.score}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">WhatsApp</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{vendor.whatsappPhone}</p>
              </div>
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Coverage</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{vendor.geographicalScope.join(", ")}</p>
              </div>
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Assigned projects</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{vendor.assignedProjectIds.length}</p>
              </div>
            </div>

            {canManageVendors ? (
              <details className="mt-4 rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">Edit vendor</summary>
                <form action={updateVendorAction} className="mt-4 grid gap-4">
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <input name="name" defaultValue={vendor.name} placeholder="Vendor name" className="h-12 rounded-2xl px-4" />
                  <input name="primaryContactName" defaultValue={vendor.primaryContactName} placeholder="Primary contact" className="h-12 rounded-2xl px-4" />
                  <input name="email" defaultValue={vendor.email} placeholder="Email" className="h-12 rounded-2xl px-4" />
                  <input name="whatsappPhone" defaultValue={vendor.whatsappPhone} placeholder="WhatsApp phone" className="h-12 rounded-2xl px-4" />
                  <input name="organizationType" defaultValue={vendor.organizationType} placeholder="Organization type" className="h-12 rounded-2xl px-4" />
                  <input name="geographicalScope" defaultValue={vendor.geographicalScope.join(", ")} placeholder="States, comma separated" className="h-12 rounded-2xl px-4" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="contractValidUntil" defaultValue={vendor.contractValidUntil} type="date" className="h-12 rounded-2xl px-4" />
                    <input name="rateCardInr" defaultValue={vendor.rateCardInr} type="number" placeholder="Rate card" className="h-12 rounded-2xl px-4" />
                  </div>
                  <textarea name="notes" defaultValue={vendor.notes} placeholder="Notes" className="min-h-28 rounded-3xl px-4 py-3" />
                  <div className="flex flex-wrap gap-3">
                    <ConfirmSubmitButton
                      confirmMessage={`Save changes for ${vendor.name}?`}
                      pendingLabel="Saving..."
                      className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]"
                    >
                      Save vendor
                    </ConfirmSubmitButton>
                  </div>
                </form>

                {canDeleteVendors ? (
                  <form action={deleteVendorAction} className="mt-3">
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Delete ${vendor.name}? This cannot be undone.`}
                      pendingLabel="Deleting..."
                      className="rounded-full border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                    >
                      Delete vendor
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </details>
            ) : null}
          </div>
        ))}
        </div>

        {canManageVendors ? (
        <form action={createVendorAction} className="glass-card rounded-[28px] p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Onboard vendor</p>
        <div className="mt-4 grid gap-4">
          <input name="name" placeholder="Vendor name" className="h-12 rounded-2xl px-4" />
          <input name="primaryContactName" placeholder="Primary contact" className="h-12 rounded-2xl px-4" />
          <input name="email" placeholder="Email" className="h-12 rounded-2xl px-4" />
          <input name="whatsappPhone" placeholder="WhatsApp phone" className="h-12 rounded-2xl px-4" />
          <input name="organizationType" placeholder="Organization type" className="h-12 rounded-2xl px-4" />
          <input name="geographicalScope" placeholder="States, comma separated" className="h-12 rounded-2xl px-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="contractValidUntil" type="date" className="h-12 rounded-2xl px-4" />
            <input name="rateCardInr" type="number" placeholder="Rate card" className="h-12 rounded-2xl px-4" />
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
            <p className="text-sm font-medium text-[var(--foreground)]">Optional vendor login</p>
            <p className="mt-1 text-sm text-[var(--gray-mid)]">Employees can onboard the vendor and issue credentials in the same step.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input name="username" placeholder="Vendor user ID" className="h-12 rounded-2xl px-4" />
              <input name="password" placeholder="Vendor password" className="h-12 rounded-2xl px-4" />
            </div>
          </div>
          <textarea name="notes" placeholder="Notes" className="min-h-28 rounded-3xl px-4 py-3" />
          <ConfirmSubmitButton
            confirmMessage="Create this vendor?"
            pendingLabel="Creating..."
            className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]"
          >
            Create vendor
          </ConfirmSubmitButton>
        </div>
        </form>
        ) : null}
      </div>
    </div>
  );
}
