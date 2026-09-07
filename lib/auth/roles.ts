import type { AppRole } from "@/lib/constants/nav";

export function canAccessRoute(role: AppRole, path: string) {
  if (role === "admin") {
    return true;
  }

  const restrictedRoutes: Record<string, AppRole[]> = {
    "/analytics": ["admin", "leadership"],
    "/content": ["admin", "content_team"],
    "/distribution": ["admin", "content_team"],
    "/projects": ["admin", "project_manager", "vendor"],
    "/settings": ["admin"],
    "/vendors": ["admin", "project_manager", "content_team", "vendor", "leadership"]
  };

  const allowed = restrictedRoutes[path];
  if (!allowed) {
    return true;
  }

  return allowed.includes(role);
}
