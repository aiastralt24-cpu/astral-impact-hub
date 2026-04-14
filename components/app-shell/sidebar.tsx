"use client";

import { LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { navItems } from "@/lib/constants/nav";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types/domain";

function getProfileLines(session: AppUser) {
  if (session.isSuperAdmin) {
    return { title: "Super Admin", subtitle: null };
  }

  return {
    title: session.fullName,
    subtitle: session.role === "vendor" ? "Vendor" : "Employee"
  };
}

export function Sidebar({ session }: { session: AppUser }) {
  const pathname = usePathname();
  const availableNav = navItems.filter((item) => item.roles.includes(session.role));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = getProfileLines(session);

  useEffect(() => {
    const stored = window.localStorage.getItem("astral-sidebar-collapsed");
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("astral-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="glass-panel fixed left-6 top-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--foreground)] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[rgba(18,26,39,0.18)] backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-6 left-6 z-40 flex flex-col rounded-[32px] border border-[rgba(18,26,39,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,254,0.94))] px-4 py-4 text-[var(--foreground)] shadow-[0_18px_52px_rgba(16,24,40,0.10)] backdrop-blur-[22px] transition-all duration-300 lg:sticky lg:top-6 lg:z-10 lg:ml-6 lg:mr-6 lg:h-[calc(100vh-3rem)] lg:self-start",
          collapsed ? "w-[84px]" : "w-[276px]",
          mobileOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        )}
      >
        <div className={cn("mb-4", collapsed ? "space-y-3" : "flex items-start justify-between gap-3")}>
          <Link href="/" className={cn("min-w-0", collapsed ? "flex w-full justify-center" : "block")}>
            {collapsed ? (
              <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-[rgba(18,26,39,0.08)] bg-white/84 text-sm font-semibold tracking-[0.18em] text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                AF
              </span>
            ) : (
              <div>
                <p className="font-display text-[1.15rem] font-black leading-none tracking-[-0.03em] text-[var(--foreground)]">
                  Astral Foundation
                </p>
              </div>
            )}
          </Link>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden rounded-2xl bg-white/84 p-2 text-[var(--gray-mid)] ring-1 ring-[var(--border)] transition hover:bg-white lg:block"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl bg-[#f7f8fc] p-2 text-[var(--gray-mid)] ring-1 ring-[var(--border)] lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!collapsed ? (
          <div className="mb-4 rounded-[22px] bg-white/72 p-3.5 text-sm ring-1 ring-[rgba(18,26,39,0.08)]">
            <p className="font-medium text-[var(--foreground)]">{profile.title}</p>
            {profile.subtitle ? <p className="text-[var(--gray-mid)]">{profile.subtitle}</p> : null}
          </div>
        ) : null}

        {!collapsed ? <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gray-mid)]">Workspace</p> : null}
        <nav className={cn("flex-1", collapsed ? "space-y-2" : "space-y-1")}>
          {availableNav.map((item, index) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const FallbackIcon = index === 0 ? LayoutDashboard : Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center rounded-2xl text-sm transition-all",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5",
                  active
                    ? "bg-[rgba(0,89,255,0.12)] text-[var(--primary)] ring-1 ring-[rgba(0,89,255,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                    : "text-[var(--gray-mid)] hover:bg-white/70 hover:text-[var(--foreground)]"
                )}
              >
                <FallbackIcon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-[var(--primary)]" : "text-current")} />
                {!collapsed ? <span className="flex-1">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3">
          <SignOutButton collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
