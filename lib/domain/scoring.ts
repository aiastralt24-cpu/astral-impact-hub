import type { ProjectRecord, UpdateRecord, VendorRecord } from "@/types/domain";

export function computeReadinessScore(update: Pick<
  UpdateRecord,
  | "description"
  | "whyItMatters"
  | "highlightMoment"
  | "quote"
  | "progressPercent"
  | "media"
  | "socialMediaWorthy"
>) {
  let score = 0;
  score += Math.min(30, update.description.length / 10);
  score += update.whyItMatters ? 15 : 0;
  score += update.highlightMoment ? 10 : 0;
  score += update.quote ? 10 : 0;
  score += Math.min(20, update.media.length * 5);
  score += update.socialMediaWorthy ? 10 : 0;
  score += update.progressPercent >= 50 ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeProjectHealth(project: ProjectRecord, updates: UpdateRecord[]) {
  const projectUpdates = updates.filter((update) => update.projectId === project.id);
  if (projectUpdates.length === 0) {
    return 25;
  }

  const latestUpdate = [...projectUpdates].sort((a: UpdateRecord, b: UpdateRecord) => b.happenedAt.localeCompare(a.happenedAt))[0];
  const readinessAverage =
    projectUpdates.reduce((sum, update) => sum + update.readinessScore, 0) / projectUpdates.length;
  const pendingPenalty = projectUpdates.filter((update) => ["pending", "in_review", "revision_requested"].includes(update.status)).length * 8;
  const freshnessBonus = latestUpdate.happenedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) ? 20 : 0;

  return Math.max(0, Math.min(100, Math.round(readinessAverage * 0.6 + freshnessBonus - pendingPenalty + 20)));
}

export function computeVendorScore(vendor: VendorRecord, updates: UpdateRecord[]) {
  const vendorUpdates = updates.filter((update) => update.vendorId === vendor.id);
  if (vendorUpdates.length === 0) {
    return 40;
  }

  const readinessAverage = vendorUpdates.reduce((sum, update) => sum + update.readinessScore, 0) / vendorUpdates.length;
  const approvalRate =
    vendorUpdates.filter((update) => update.status === "approved" || update.status === "published").length /
    vendorUpdates.length;
  const mediaRate = vendorUpdates.filter((update) => update.media.length >= 3).length / vendorUpdates.length;

  return Math.round(readinessAverage * 0.45 + approvalRate * 35 + mediaRate * 20);
}
