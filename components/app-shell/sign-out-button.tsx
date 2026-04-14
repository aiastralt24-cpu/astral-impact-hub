import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/dashboard/actions";

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        className={`w-full rounded-2xl border border-[var(--border)] bg-white/72 text-sm text-[var(--gray-mid)] transition hover:bg-white hover:text-[var(--foreground)] ${
          collapsed ? "flex h-11 items-center justify-center px-0" : "flex h-11 items-center gap-2 px-4"
        }`}
      >
        <LogOut className="h-4 w-4" />
        {collapsed ? null : <span>Sign out</span>}
      </button>
    </form>
  );
}
