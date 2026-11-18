import Link from "next/link";
import type { VendorRecord } from "@/types/domain";
import { SearchableList } from "@/components/ui/searchable-list";

export function VendorDirectory({ vendors }: { vendors: VendorRecord[] }) {
  return <SearchableList label="associates" entries={vendors.map(vendor => ({ id: vendor.id, search: `${vendor.name} ${vendor.primaryContactName} ${vendor.whatsappPhone} ${vendor.geographicalScope.join(" ")}`, content: <div className="grid items-center gap-4 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
    <div className="min-w-0"><Link href={`/vendors/${vendor.id}`} className="text-base font-semibold hover:text-[var(--primary)]">{vendor.name}</Link>{vendor.primaryContactName && vendor.primaryContactName !== vendor.whatsappPhone && <p className="mt-1 text-sm text-[var(--gray-mid)]">{vendor.primaryContactName}</p>}</div>
    <div><p className="text-xs text-[var(--gray-mid)]">Contact</p><p className="mt-1 break-words text-sm">{vendor.whatsappPhone || vendor.email || "Not added"}</p></div>
    <div><p className="text-xs text-[var(--gray-mid)]">Location</p><p className="mt-1 text-sm">{vendor.geographicalScope.join(", ") || "Not added"}</p></div>
    <div className="flex items-center justify-between gap-6 md:justify-end"><span className="whitespace-nowrap text-xs text-[var(--gray-mid)]">{vendor.assignedProjectIds.length} projects</span><Link href={`/vendors/${vendor.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-slate-50">View details</Link></div>
  </div> }))} />;
}
