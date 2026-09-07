import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Send,
  Settings,
  Sparkles,
  Users
} from "lucide-react";

export type AppRole =
  | "admin"
  | "project_manager"
  | "vendor"
  | "content_team"
  | "leadership";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "project_manager", "vendor", "content_team", "leadership"] },
  { href: "/projects", label: "Projects", icon: FolderOpen, roles: ["admin", "project_manager", "vendor"] },
  { href: "/updates", label: "Updates", icon: FileText, roles: ["admin", "project_manager", "content_team", "vendor"] },
  { href: "/vendors", label: "CSR Associates", icon: Users, roles: ["admin", "project_manager", "content_team", "vendor", "leadership"] },
  { href: "/media", label: "Media", icon: ImageIcon, roles: ["admin", "project_manager", "content_team", "vendor", "leadership"] },
  { href: "/content", label: "Stories & Messages", icon: Sparkles, roles: ["admin", "content_team"] },
  { href: "/distribution", label: "Share Content", icon: Send, roles: ["admin", "content_team"] },
  { href: "/analytics", label: "Reports & Insights", icon: BarChart3, roles: ["admin", "leadership"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] }
];
