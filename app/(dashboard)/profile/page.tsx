import { Building2, FolderOpen, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { updateOwnProfileAction } from "@/features/profile/actions";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const session = await requireSession();
  if (session.role !== "vendor") redirect("/dashboard");
  const [data, query] = await Promise.all([getDashboardData(session), searchParams]);
  const vendor = data.vendors.find((item) => session.assignedVendorIds.includes(item.id));

  if (!vendor) return <div className="glass-card max-w-2xl rounded-[28px] p-6"><h1 className="font-display text-3xl font-black">My Profile</h1><p className="mt-3 text-[var(--gray-mid)]">Your CSR Associate profile is not connected yet. Please contact the Astral Foundation team.</p></div>;

  return <div className="mx-auto max-w-5xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">CSR Associate account</p><h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em]">My Profile</h1><p className="mt-2 text-sm text-[var(--gray-mid)]">Keep your organization and contact information accurate for the Astral Foundation team.</p></header>
    {query.saved ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Your profile has been updated successfully.</p> : null}
    {query.error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{query.error === "required-fields" ? "Organization name and primary contact are required." : "Your profile could not be found. Please contact the Astral Foundation team."}</p> : null}

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="glass-card rounded-[22px] p-4"><Building2 className="h-5 w-5 text-[var(--primary)]" /><p className="mt-3 text-xs text-[var(--gray-mid)]">Organization</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{vendor.name}</p></div>
      <div className="glass-card rounded-[22px] p-4"><UserRound className="h-5 w-5 text-[var(--primary)]" /><p className="mt-3 text-xs text-[var(--gray-mid)]">Primary contact</p><p className="mt-1 text-sm font-semibold">{vendor.primaryContactName}</p></div>
      <div className="glass-card rounded-[22px] p-4"><FolderOpen className="h-5 w-5 text-[var(--primary)]" /><p className="mt-3 text-xs text-[var(--gray-mid)]">Assigned projects</p><p className="mt-1 text-sm font-semibold">{vendor.assignedProjectIds.length}</p></div>
      <div className="glass-card rounded-[22px] p-4"><MapPin className="h-5 w-5 text-[var(--primary)]" /><p className="mt-3 text-xs text-[var(--gray-mid)]">Coverage</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{vendor.geographicalScope.join(", ") || "Not added"}</p></div>
    </section>

    <form action={updateOwnProfileAction} className="glass-card rounded-[28px] p-5 sm:p-7">
      <div className="border-b border-[var(--border)] pb-5"><h2 className="font-display text-2xl font-black">Profile details</h2><p className="mt-1 text-sm text-[var(--gray-mid)]">You can update these details whenever they change.</p></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Organization name<input name="name" defaultValue={vendor.name} required className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Organization type<input name="organizationType" defaultValue={vendor.organizationType} placeholder="NGO, foundation, trust..." className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Primary contact<input name="primaryContactName" defaultValue={vendor.primaryContactName} required className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Email<div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-mid)]" /><input type="email" name="email" defaultValue={vendor.email} className="h-12 w-full rounded-2xl pl-11 pr-4 font-normal" /></div></label>
        <label className="grid gap-2 text-sm font-semibold">WhatsApp phone<div className="relative"><Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-mid)]" /><input name="whatsappPhone" defaultValue={vendor.whatsappPhone} className="h-12 w-full rounded-2xl pl-11 pr-4 font-normal" /></div></label>
        <label className="grid gap-2 text-sm font-semibold">States or regions<input name="geographicalScope" defaultValue={vendor.geographicalScope.join(", ")} placeholder="Comma separated" className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Instagram<input name="instagramHandle" defaultValue={vendor.instagramHandle} placeholder="Handle or profile URL" className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Facebook<input name="facebookHandle" defaultValue={vendor.facebookHandle} placeholder="Page name or URL" className="h-12 rounded-2xl px-4 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold sm:col-span-2">About your organization<textarea name="notes" defaultValue={vendor.notes} placeholder="Add any useful organization information" className="min-h-28 rounded-2xl px-4 py-3 font-normal" /></label>
      </div>
      <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-5"><ConfirmSubmitButton pendingLabel="Saving profile..." className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">Save profile</ConfirmSubmitButton></div>
    </form>
  </div>;
}
