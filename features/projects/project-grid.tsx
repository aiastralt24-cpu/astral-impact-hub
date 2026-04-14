import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectRecord } from "@/types/domain";

const statusVariant = {
  active: "approved",
  at_risk: "rejected",
  draft: "neutral",
  on_hold: "pending",
  completed: "published",
  archived: "neutral"
} as const;

export function ProjectGrid({ projects }: { projects: ProjectRecord[] }) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden bg-transparent">
          <div className="relative aspect-[16/9] bg-[linear-gradient(135deg,#3850c8_0%,#5668da_48%,#7f92eb_100%)] p-5 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.12),transparent_0,transparent_28%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.12),transparent_0,transparent_18%)]" />
            <div className="flex items-start justify-between gap-3">
              <Badge variant="published" className="border-white/18 bg-white/16 text-white">
                {project.category}
              </Badge>
              <Badge
                variant={project.readinessScore >= 75 ? "approved" : project.readinessScore < 45 ? "rejected" : "pending"}
                className="border-white/42 bg-white/82 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.10)]"
              >
                Ready {project.readinessScore}
              </Badge>
            </div>
            <div className="relative mt-10">
              <p className="font-display text-2xl font-bold">{project.name}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--gray-mid)]">Health score</span>
              <span className="font-semibold text-[var(--foreground)]">{project.healthScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-[#ebeff6]">
              <div
                className={
                  project.healthScore < 45
                    ? "h-2 rounded-full bg-[linear-gradient(90deg,#e45b73,#f59aa9)]"
                    : project.healthScore < 70
                      ? "h-2 rounded-full bg-[linear-gradient(90deg,#f0b34f,#f5d28d)]"
                      : "h-2 rounded-full bg-[linear-gradient(90deg,#5d63ff,#8f9dff)]"
                }
                style={{ width: `${project.healthScore}%` }}
              />
            </div>
            <div
              className={
                project.healthScore < 45
                  ? "rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"
                  : project.healthScore < 70
                    ? "rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200"
                    : "rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200"
              }
            >
              {project.healthScore < 45
                ? "Needs immediate attention"
                : project.healthScore < 70
                  ? "Needs follow-up this week"
                  : "Healthy and moving"}
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--gray-mid)]">
              <span>{project.vendorName}</span>
              <Badge variant={statusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
