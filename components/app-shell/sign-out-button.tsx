"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { logoutAction } from "@/features/dashboard/actions";

function SignOutControl({ collapsed }: { collapsed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      aria-busy={pending}
      className={`w-full rounded-2xl border border-[var(--border)] bg-white/72 text-sm text-[var(--gray-mid)] transition hover:bg-white hover:text-[var(--foreground)] disabled:cursor-wait disabled:opacity-70 ${
        collapsed ? "flex h-11 items-center justify-center px-0" : "flex h-11 items-center gap-2 px-4"
      }`}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {collapsed ? null : <span>{pending ? "Signing out…" : "Sign out"}</span>}
    </button>
  );
}

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={logoutAction}>
      <SignOutControl collapsed={collapsed} />
    </form>
  );
}
