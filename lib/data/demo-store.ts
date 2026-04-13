import "server-only";

import { cache } from "react";

import { AnthropicContentProvider } from "@/lib/ai/provider";
import { computeProjectHealth, computeReadinessScore, computeVendorScore } from "@/lib/domain/scoring";
import type {
  AppUser,
  ApprovalComment,
  ApprovalRecord,
  DistributionLogRecord,
  DistributionRequestRecord,
  GeneratedContentRecord,
  MetricTile,
  ProjectRecord,
  UpdateRecord,
  VendorRecord
} from "@/types/domain";

type DemoDatabase = {
  users: AppUser[];
  vendors: VendorRecord[];
  projects: ProjectRecord[];
  updates: UpdateRecord[];
  approvals: ApprovalRecord[];
  generatedContent: GeneratedContentRecord[];
  distributionLog: DistributionLogRecord[];
};

declare global {
  var __astralDemoDb: DemoDatabase | undefined;
}

function createSeedDatabase(): DemoDatabase {
  const users: AppUser[] = [
    { id: "11111111-1111-4111-8111-111111111111", fullName: "Aniket Dhuri", email: "aniket@astral.test", role: "admin" },
    { id: "22222222-2222-4222-8222-222222222222", fullName: "Radhika Mehta", email: "pm@astral.test", role: "project_manager" },
    { id: "33333333-3333-4333-8333-333333333333", fullName: "Maya Shah", email: "content@astral.test", role: "content_team" },
    { id: "44444444-4444-4444-8444-444444444444", fullName: "WildRoots Vendor", email: "vendor@astral.test", role: "vendor" },
    { id: "55555555-5555-4555-8555-555555555555", fullName: "CSR Leadership", email: "leadership@astral.test", role: "leadership" }
  ];

  const vendors: VendorRecord[] = [
    {
      id: "66666666-6666-4666-8666-666666666666",
      name: "WildRoots Conservation",
      primaryContactName: "Riya Kale",
      email: "riya@wildroots.test",
      whatsappPhone: "+919999999999",
      organizationType: "NGO",
      geographicalScope: ["Maharashtra"],
      assignedProjectIds: ["77777777-7777-4777-8777-777777777777"],
      contractValidUntil: "2026-12-31",
      rateCardInr: 350000,
      notes: "Strong wildlife storytelling partner",
      score: 78
    },
    {
      id: "88888888-8888-4888-8888-888888888888",
      name: "Saheli Skills Trust",
      primaryContactName: "Aarti Patil",
      email: "aarti@saheli.test",
      whatsappPhone: "+918888888888",
      organizationType: "NGO",
      geographicalScope: ["Maharashtra", "Gujarat"],
      assignedProjectIds: ["99999999-9999-4999-8999-999999999999"],
      contractValidUntil: "2026-09-30",
      rateCardInr: 420000,
      notes: "Women livelihood cluster partner",
      score: 72
    }
  ];

  const projects: ProjectRecord[] = [
    {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Tadoba Waterhole Revival",
      category: "Wildlife",
      subCategory: "Waterhole",
      state: "Maharashtra",
      district: "Chandrapur",
      location: "Chandrapur, Maharashtra",
      status: "active",
      healthScore: 84,
      readinessScore: 78,
      reportingFrequency: "weekly",
      vendorName: "WildRoots Conservation",
      vendorIds: ["66666666-6666-4666-8666-666666666666"],
      strategicTags: ["CSR", "Seasonal"],
      emotionalTags: ["Wildlife", "Water"],
      budgetInr: 2500000,
      internalOwnerId: "22222222-2222-4222-8222-222222222222",
      beneficiaryTarget: 400,
      projectBrief: "Restore and monitor wildlife water access before peak summer.",
      startDate: "2026-04-01",
      endDate: "2026-09-30",
      requireAdminApproval: false
    },
    {
      id: "99999999-9999-4999-8999-999999999999",
      name: "Women's Livelihood Clusters",
      category: "Women",
      subCategory: "Skills",
      state: "Maharashtra",
      district: "Jalna",
      location: "Jalna, Maharashtra",
      status: "active",
      healthScore: 71,
      readinessScore: 81,
      reportingFrequency: "monthly",
      vendorName: "Saheli Skills Trust",
      vendorIds: ["88888888-8888-4888-8888-888888888888"],
      strategicTags: ["CSR"],
      emotionalTags: ["Women", "Community"],
      budgetInr: 3200000,
      internalOwnerId: "22222222-2222-4222-8222-222222222222",
      beneficiaryTarget: 120,
      projectBrief: "Support women-led livelihood networks with training and market access.",
      startDate: "2026-03-15",
      endDate: "2026-11-30",
      requireAdminApproval: true
    }
  ];

  const updates: UpdateRecord[] = [
    {
      id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      projectId: projects[0].id,
      projectName: projects[0].name,
      vendorId: vendors[0].id,
      vendorName: vendors[0].name,
      submittedByUserId: "44444444-4444-4444-8444-444444444444",
      happenedAt: "2026-04-10",
      description: "Desilting work completed across one wildlife waterhole and fresh water flow restored near the central access path.",
      beneficiariesCount: 67,
      beneficiaryType: "Animals",
      progressPercent: 62,
      workDuration: "full_day",
      whyItMatters: "This zone has been drying rapidly and wildlife movement depends on this source.",
      highlightMoment: "Fresh pugmarks appeared close to the restored edge by sunrise.",
      quote: "The team could see the waterline return before noon.",
      challenges: "Machinery access was delayed by soft ground.",
      nextSteps: "Stabilize the banks and continue daily checks.",
      socialMediaWorthy: true,
      urgent: false,
      documentationOnly: false,
      sensitiveContent: false,
      media: [
        { id: crypto.randomUUID(), name: "waterhole-before.jpg", caption: "Before restoration" },
        { id: crypto.randomUUID(), name: "waterhole-after.jpg", caption: "After water returned" },
        { id: crypto.randomUUID(), name: "field-team.mp4", caption: "Team on site" }
      ],
      readinessScore: 82,
      status: "pending",
      revisionCount: 0,
      createdAt: new Date("2026-04-10T09:00:00Z").toISOString()
    }
  ];

  return { users, vendors, projects, updates, approvals: [], generatedContent: [], distributionLog: [] };
}

function getDb() {
  if (!globalThis.__astralDemoDb) {
    globalThis.__astralDemoDb = createSeedDatabase();
  }

  return globalThis.__astralDemoDb;
}

export const getCurrentData = cache(async () => {
  return structuredClone(getDb());
});

export async function getUserByRole(role: AppUser["role"]) {
  return getDb().users.find((user) => user.role === role) ?? null;
}

export async function getUserById(id: string) {
  return getDb().users.find((user) => user.id === id) ?? null;
}

export async function createProject(input: Omit<ProjectRecord, "id" | "healthScore" | "readinessScore" | "vendorName" | "location">) {
  const db = getDb();
  const vendors = db.vendors.filter((vendor) => input.vendorIds.includes(vendor.id));
  const project: ProjectRecord = {
    ...input,
    id: crypto.randomUUID(),
    location: `${input.district}, ${input.state}`,
    vendorName: vendors.map((vendor) => vendor.name).join(", "),
    healthScore: 50,
    readinessScore: 0
  };
  db.projects.unshift(project);
  vendors.forEach((vendor) => {
    if (!vendor.assignedProjectIds.includes(project.id)) {
      vendor.assignedProjectIds.push(project.id);
    }
  });
  return project;
}

export async function createVendor(input: Omit<VendorRecord, "id" | "assignedProjectIds" | "score">) {
  const db = getDb();
  const vendor: VendorRecord = {
    ...input,
    id: crypto.randomUUID(),
    assignedProjectIds: [],
    score: 50
  };
  db.vendors.unshift(vendor);
  return vendor;
}

export async function createUpdate(input: Omit<UpdateRecord, "id" | "readinessScore" | "status" | "revisionCount" | "createdAt">) {
  const db = getDb();
  const readinessScore = computeReadinessScore({
    description: input.description,
    whyItMatters: input.whyItMatters,
    highlightMoment: input.highlightMoment,
    quote: input.quote,
    progressPercent: input.progressPercent,
    media: input.media,
    socialMediaWorthy: input.socialMediaWorthy
  });

  const update: UpdateRecord = {
    ...input,
    id: crypto.randomUUID(),
    readinessScore,
    status: "pending",
    revisionCount: 0,
    createdAt: new Date().toISOString()
  };

  db.updates.unshift(update);
  recomputeScores(db);
  return update;
}

export async function recordApproval({
  updateId,
  reviewerId,
  action,
  stage,
  comment
}: {
  updateId: string;
  reviewerId: string;
  action: ApprovalRecord["action"];
  stage: ApprovalRecord["stage"];
  comment?: string;
}) {
  const db = getDb();
  const update = db.updates.find((entry) => entry.id === updateId);
  const reviewer = db.users.find((user) => user.id === reviewerId);

  if (!update || !reviewer) {
    return null;
  }

  const approval: ApprovalRecord = {
    id: crypto.randomUUID(),
    updateId,
    reviewerId,
    reviewerName: reviewer.fullName,
    action,
    stage,
    comment,
    createdAt: new Date().toISOString()
  };

  db.approvals.unshift(approval);

  if (action === "approve") {
    update.status = "approved";
  } else if (action === "request_revision") {
    update.status = "revision_requested";
    update.revisionCount += 1;
  } else if (action === "reject") {
    update.status = "rejected";
  } else if (action === "escalate") {
    update.status = "in_review";
  }

  recomputeScores(db);
  return approval;
}

export async function generateContent(updateId: string) {
  const db = getDb();
  const update = db.updates.find((entry) => entry.id === updateId);
  const project = db.projects.find((entry) => entry.id === update?.projectId);

  if (!update || !project) {
    return null;
  }

  const existing = db.generatedContent.find((entry) => entry.updateId === updateId);
  if (existing) {
    return existing;
  }

  const provider = new AnthropicContentProvider();
  const generated = await provider.generateContent({
    projectContext: project.projectBrief ?? project.name,
    updateData: JSON.stringify(update, null, 2),
    campaignContext: project.emotionalTags.join(", "),
    requestedOutputs: [
      "emotionalHook",
      "instagramCaptionShort",
      "instagramCaptionLong",
      "reelScript",
      "carouselBreakdown",
      "telegramUpdate",
      "whatsappDigest",
      "csrSummary"
    ]
  });

  const content: GeneratedContentRecord = {
    id: crypto.randomUUID(),
    updateId,
    projectName: project.name,
    vendorName: update.vendorName,
    ...generated,
    createdAt: new Date().toISOString()
  };

  db.generatedContent.unshift(content);
  return content;
}

export async function distributeContent(request: DistributionRequestRecord) {
  const db = getDb();
  const generatedContent = db.generatedContent.find((entry) => entry.id === request.contentId);
  const update = db.updates.find((entry) => entry.id === request.updateId);
  if (!generatedContent || !update) {
    return null;
  }

  const log: DistributionLogRecord = {
    id: crypto.randomUUID(),
    updateId: request.updateId,
    contentId: request.contentId,
    channel: request.channel,
    status: "sent",
    message: `${request.channel} delivery ${request.channel === "telegram" ? "queued" : "simulated"} successfully`,
    createdAt: new Date().toISOString()
  };

  db.distributionLog.unshift(log);
  if (request.channel === "telegram") {
    update.status = "published";
  }
  return log;
}

export async function getDashboardData() {
  const db = getDb();
  recomputeScores(db);

  const metrics: MetricTile[] = [
    {
      label: "On-time vendor updates",
      value: `${Math.round((db.updates.filter((update) => update.status !== "rejected").length / Math.max(db.updates.length, 1)) * 100)}%`,
      trend: `${db.updates.length} tracked updates`,
      tone: "positive"
    },
    {
      label: "Pending approvals",
      value: `${db.updates.filter((update) => update.status === "pending" || update.status === "in_review").length}`,
      trend: `${db.updates.filter((update) => update.status === "revision_requested").length} awaiting revision`,
      tone: "warning"
    },
    {
      label: "Generated content packages",
      value: `${db.generatedContent.length}`,
      trend: `${db.generatedContent.filter((entry) => new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`,
      tone: "positive"
    },
    {
      label: "Published deliveries",
      value: `${db.distributionLog.length}`,
      trend: `${db.distributionLog.filter((entry) => entry.channel === "telegram").length} Telegram sends`,
      tone: "neutral"
    }
  ];

  return {
    users: structuredClone(db.users),
    vendors: structuredClone(db.vendors),
    projects: structuredClone(db.projects),
    updates: structuredClone(db.updates),
    approvals: structuredClone(db.approvals),
    generatedContent: structuredClone(db.generatedContent),
    distributionLog: structuredClone(db.distributionLog),
    metrics
  };
}

function recomputeScores(db: DemoDatabase) {
  db.projects = db.projects.map((project) => {
    const relatedUpdates = db.updates.filter((update) => update.projectId === project.id);
    const readinessAverage =
      relatedUpdates.length > 0
        ? Math.round(relatedUpdates.reduce((sum, update) => sum + update.readinessScore, 0) / relatedUpdates.length)
        : 0;
    return {
      ...project,
      readinessScore: readinessAverage,
      healthScore: computeProjectHealth(project, db.updates)
    };
  });

  db.vendors = db.vendors.map((vendor) => ({
    ...vendor,
    score: computeVendorScore(vendor, db.updates)
  }));
}

export function getApprovalComments(updateId: string): ApprovalComment[] {
  return getDb()
    .approvals.filter((approval) => approval.updateId === updateId)
    .map((approval) => ({
      id: approval.id,
      author: approval.reviewerName,
      message: approval.comment ?? `${approval.action} at ${approval.stage} stage`,
      createdAt: approval.createdAt
    }));
}
