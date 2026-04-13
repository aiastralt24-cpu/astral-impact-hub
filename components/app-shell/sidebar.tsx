"use client";

import { LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/app-shell/brand-mark";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { navItems } from "@/lib/constants/nav";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types/domain";

export function Sidebar({ session }: { session: AppUser }) {
  const pathname = usePathname();
  const availableNav = navItems.filter((item) => item.roles.includes(session.role));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className="glass-panel fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--foreground)] lg:hidden"
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
          "glass-panel fixed inset-y-4 left-4 z-40 flex flex-col rounded-[32px] px-4 py-4 text-[var(--foreground)] transition-all duration-300 lg:sticky lg:top-4 lg:z-10 lg:ml-4 lg:mr-4 lg:h-[calc(100vh-2rem)] lg:self-start",
          collapsed ? "w-[92px]" : "w-[292px]",
          mobileOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className={cn("min-w-0", collapsed && "flex w-full justify-center")}>
            <BrandMark dark compact={collapsed} className="w-fit" />
            {!collapsed ? <p className="mt-4 text-sm leading-7 text-[var(--gray-mid)]">Impact operations and publishing.</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden rounded-2xl bg-[#f7f8fc] p-2 text-[var(--gray-mid)] ring-1 ring-[var(--border)] transition hover:bg-white lg:block"
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
          <div className="mb-5 rounded-[24px] bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
            <p className="font-medium text-[var(--foreground)]">{session.fullName}</p>
            <p className="text-[var(--gray-mid)]">{session.role.replaceAll("_", " ")}</p>
          </div>
        ) : null}

        <nav className="flex-1 space-y-1.5">
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
                  "flex items-center rounded-2xl text-sm transition-all",
                  collapsed ? "justify-center px-0 py-3.5" : "gap-3 px-4 py-3",
                  active
                    ? "bg-[var(--primary-light)] text-[var(--primary)] ring-1 ring-[rgba(93,99,255,0.12)]"
                    : "text-[var(--gray-mid)] hover:bg-[#f7f8fc] hover:text-[var(--foreground)]"
                )}
              >
                <FallbackIcon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4">
          <SignOutButton collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
