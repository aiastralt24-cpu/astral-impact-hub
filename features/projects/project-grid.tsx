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
          <div className="relative aspect-[16/9] bg-[linear-gradient(135deg,rgba(93,99,255,0.92)_0%,rgba(110,121,255,0.88)_52%,rgba(198,209,255,0.74)_140%)] p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="published" className="border-white/12 bg-white/16 text-white">
                {project.category}
              </Badge>
              <Badge variant={project.readinessScore >= 75 ? "approved" : "pending"}>
                Ready {project.readinessScore}
              </Badge>
            </div>
            <div className="mt-10">
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
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,#5d63ff,#8f9dff)]" style={{ width: `${project.healthScore}%` }} />
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
