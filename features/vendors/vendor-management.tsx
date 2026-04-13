import { createVendorAction } from "@/features/vendors/actions";
import type { VendorRecord } from "@/types/domain";

type VendorManagementProps = {
  vendors: VendorRecord[];
};

export function VendorManagement({ vendors }: VendorManagementProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="space-y-4">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-black">{vendor.name}</h3>
                <p className="mt-1 text-sm text-[var(--gray-mid)]">{vendor.primaryContactName}</p>
              </div>
              <div className={`rounded-full px-3 py-2 text-sm font-semibold ${vendor.score >= 70 ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF3C7] text-[#D97706]"}`}>
                Score {vendor.score}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-[var(--primary-light)] p-4 text-sm">
                <p className="text-[var(--gray-mid)]">WhatsApp</p>
                <p className="mt-1 font-medium">{vendor.whatsappPhone}</p>
              </div>
              <div className="rounded-3xl bg-[var(--primary-light)] p-4 text-sm">
                <p className="text-[var(--gray-mid)]">Coverage</p>
                <p className="mt-1 font-medium">{vendor.geographicalScope.join(", ")}</p>
              </div>
              <div className="rounded-3xl bg-[var(--primary-light)] p-4 text-sm">
                <p className="text-[var(--gray-mid)]">Assigned projects</p>
                <p className="mt-1 font-medium">{vendor.assignedProjectIds.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form action={createVendorAction} className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Onboard vendor</p>
        <div className="mt-4 grid gap-4">
          <input name="name" placeholder="Vendor name" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <input name="primaryContactName" placeholder="Primary contact" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <input name="email" placeholder="Email" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <input name="whatsappPhone" placeholder="WhatsApp phone" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <input name="organizationType" placeholder="Organization type" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <input name="geographicalScope" placeholder="States, comma separated" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="contractValidUntil" type="date" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
            <input name="rateCardInr" type="number" placeholder="Rate card" className="h-12 rounded-2xl border border-[var(--border)] px-4" />
          </div>
          <textarea name="notes" placeholder="Notes" className="min-h-28 rounded-3xl border border-[var(--border)] px-4 py-3" />
          <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white">Create vendor</button>
        </div>
      </form>
    </div>
  );
}
