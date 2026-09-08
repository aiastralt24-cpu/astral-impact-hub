"use client";

import { useState } from "react";

import type { VendorRecord } from "@/types/domain";

type ProjectManagementChoiceProps = {
  vendors: VendorRecord[];
  defaultVendorIds?: string[];
};

export function ProjectManagementChoice({ vendors, defaultVendorIds }: ProjectManagementChoiceProps) {
  const initialVendorIds = defaultVendorIds ?? [];
  const [managementType, setManagementType] = useState<"csr" | "internal">(
    defaultVendorIds === undefined ? "csr" : initialVendorIds.length > 0 ? "csr" : "internal"
  );
  const [selectedVendorIds, setSelectedVendorIds] = useState(initialVendorIds);

  return (
    <fieldset className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
      <legend className="px-1 text-sm font-semibold text-[var(--foreground)]">Project managed by</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className={`cursor-pointer rounded-2xl border p-3 text-sm ${managementType === "csr" ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] bg-white text-[var(--gray-mid)]"}`}>
          <input
            type="radio"
            name="managementType"
            value="csr"
            checked={managementType === "csr"}
            onChange={() => setManagementType("csr")}
            className="mr-2"
          />
          CSR Associate
        </label>
        <label className={`cursor-pointer rounded-2xl border p-3 text-sm ${managementType === "internal" ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] bg-white text-[var(--gray-mid)]"}`}>
          <input
            type="radio"
            name="managementType"
            value="internal"
            checked={managementType === "internal"}
            onChange={() => setManagementType("internal")}
            className="mr-2"
          />
          Managed internally
        </label>
      </div>

      {managementType === "csr" ? (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--border)]">
          <p className="mb-1 text-sm font-medium text-[var(--foreground)]">Select CSR Associate</p>
          <p className="mb-3 text-xs text-[var(--gray-mid)]">Choose at least one associate before saving.</p>
          {vendors.length > 0 ? (
            <div className="grid gap-2 text-sm">
              <input className="sr-only" value={selectedVendorIds.join(",")} onChange={() => undefined} required aria-hidden="true" tabIndex={-1} />
              {vendors.map((vendor) => (
                <label key={vendor.id} className="flex items-center gap-3 text-[var(--gray-mid)]">
                  <input
                    type="checkbox"
                    name="vendorIds"
                    value={vendor.id}
                    checked={selectedVendorIds.includes(vendor.id)}
                    onChange={(event) => setSelectedVendorIds((current) => event.target.checked
                      ? [...current, vendor.id]
                      : current.filter((id) => id !== vendor.id))}
                  />
                  <span>{vendor.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700">Create a CSR Associate first, or choose Managed internally.</p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[var(--gray-mid)]">The Astral Foundation team will manage this project directly.</p>
      )}
    </fieldset>
  );
}
