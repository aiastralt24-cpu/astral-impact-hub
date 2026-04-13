import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/dashboard/actions";

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        className={`w-full rounded-2xl border border-[var(--border)] bg-white/66 text-sm text-[var(--gray-mid)] transition hover:bg-white hover:text-[var(--foreground)] ${
          collapsed ? "flex items-center justify-center px-0 py-3" : "px-4 py-3 text-left"
        }`}
      >
        {collapsed ? <LogOut className="h-4 w-4" /> : "Sign out"}
      </button>
    </form>
  );
}
