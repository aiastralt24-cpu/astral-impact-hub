import { createHash } from "node:crypto";
import type { ProjectRecord, UpdateRecord } from "@/types/domain";
export function sourceHash(project: ProjectRecord, update: UpdateRecord) {
  return createHash("sha256").update(JSON.stringify({ project: project.projectBrief || project.name, name: project.name, description: update.description, happenedAt: update.happenedAt, beneficiariesCount: update.beneficiariesCount, beneficiaryType: update.beneficiaryType, progressPercent: update.progressPercent, whyItMatters: update.whyItMatters, highlightMoment: update.highlightMoment, quote: update.quote, challenges: update.challenges, nextSteps: update.nextSteps, sensitiveContent: update.sensitiveContent, media: update.media.map(item => ({ id: item.id, name: item.name, mimeType: item.mimeType, file: item.externalFileId })) })).digest("hex");
}
