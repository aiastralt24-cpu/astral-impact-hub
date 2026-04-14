import "server-only";

import { cache } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { AnthropicContentProvider } from "@/lib/ai/provider";
import { hasSupabaseBackend } from "@/lib/env";
import * as liveStore from "@/lib/data/live-store";
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

const DEMO_DB_PATH = join(process.cwd(), ".data", "demo-db.json");
const CAN_PERSIST_DEMO_DB = !process.env.VERCEL && process.env.NODE_ENV !== "production";

type DashboardData = {
  users: AppUser[];
  vendors: VendorRecord[];
  projects: ProjectRecord[];
  updates: UpdateRecord[];
  approvals: ApprovalRecord[];
  generatedContent: GeneratedContentRecord[];
  distributionLog: DistributionLogRecord[];
  metrics: MetricTile[];
};

function createSeedDatabase(): DemoDatabase {
  const users: AppUser[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      fullName: "Super Admin",
      email: "superadmin@astral.test",
      username: "superadmin",
      password: "superadmin@321",
      role: "admin",
      assignedProjectIds: [],
      assignedVendorIds: [],
      isSuperAdmin: true
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      fullName: "Radhika Mehta",
      email: "pm@astral.test",
      username: "radhika.pm",
      password: "astral@123",
      role: "project_manager",
      assignedProjectIds: ["77777777-7777-4777-8777-777777777777"],
      assignedVendorIds: ["66666666-6666-4666-8666-666666666666"],
      managedByUserId: "11111111-1111-4111-8111-111111111111"
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      fullName: "Maya Shah",
      email: "content@astral.test",
      username: "maya.content",
      password: "astral@123",
      role: "content_team",
      assignedProjectIds: ["77777777-7777-4777-8777-777777777777"],
      assignedVendorIds: ["66666666-6666-4666-8666-666666666666"],
      managedByUserId: "11111111-1111-4111-8111-111111111111"
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      fullName: "WildRoots Vendor",
      email: "vendor@astral.test",
      username: "wildroots.vendor",
      password: "vendor@123",
      role: "vendor",
      assignedProjectIds: ["77777777-7777-4777-8777-777777777777"],
      assignedVendorIds: ["66666666-6666-4666-8666-666666666666"],
      managedByUserId: "22222222-2222-4222-8222-222222222222"
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      fullName: "CSR Leadership",
      email: "leadership@astral.test",
      username: "leadership",
      password: "astral@123",
      role: "leadership",
      assignedProjectIds: ["99999999-9999-4999-8999-999999999999"],
      assignedVendorIds: ["88888888-8888-4888-8888-888888888888"],
      managedByUserId: "11111111-1111-4111-8111-111111111111"
    }
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
        {
          id: crypto.randomUUID(),
          name: "waterhole-before.jpg",
          caption: "Before restoration",
          storageProvider: "supabase",
          externalFileId: crypto.randomUUID(),
          externalFolderId: "project-media/projects/tadoba-waterhole-revival/wildroots-conservation",
          externalUrl: "supabase://project-media/projects/tadoba-waterhole-revival/wildroots-conservation/demo-waterhole-before.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 2_400_000,
          uploadedByUserId: "44444444-4444-4444-8444-444444444444",
          uploadedAt: new Date("2026-04-10T08:10:00Z").toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: "waterhole-after.jpg",
          caption: "After water returned",
          storageProvider: "supabase",
          externalFileId: crypto.randomUUID(),
          externalFolderId: "project-media/projects/tadoba-waterhole-revival/wildroots-conservation",
          externalUrl: "supabase://project-media/projects/tadoba-waterhole-revival/wildroots-conservation/demo-waterhole-after.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 2_900_000,
          uploadedByUserId: "44444444-4444-4444-8444-444444444444",
          uploadedAt: new Date("2026-04-10T08:15:00Z").toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: "field-team.mp4",
          caption: "Team on site",
          storageProvider: "supabase",
          externalFileId: crypto.randomUUID(),
          externalFolderId: "project-media/projects/tadoba-waterhole-revival/wildroots-conservation",
          externalUrl: "supabase://project-media/projects/tadoba-waterhole-revival/wildroots-conservation/demo-field-team.mp4",
          mimeType: "video/mp4",
          sizeBytes: 18_200_000,
          uploadedByUserId: "44444444-4444-4444-8444-444444444444",
          uploadedAt: new Date("2026-04-10T08:20:00Z").toISOString()
        }
      ],
      readinessScore: 82,
      status: "pending",
      revisionCount: 0,
      createdAt: new Date("2026-04-10T09:00:00Z").toISOString()
    }
  ];

  return { users, vendors, projects, updates, approvals: [], generatedContent: [], distributionLog: [] };
}

function ensureDemoDbDirectory() {
  if (!CAN_PERSIST_DEMO_DB) {
    return;
  }
  mkdirSync(dirname(DEMO_DB_PATH), { recursive: true });
}

function saveDb(db: DemoDatabase) {
  if (!CAN_PERSIST_DEMO_DB) {
    return;
  }
  ensureDemoDbDirectory();
  try {
    writeFileSync(DEMO_DB_PATH, JSON.stringify(db, null, 2));
  } catch {
    // Ignore persistence failures in environments with ephemeral or read-only filesystems.
  }
}

function loadDbFromDisk() {
  if (!CAN_PERSIST_DEMO_DB) {
    return null;
  }
  if (!existsSync(DEMO_DB_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(DEMO_DB_PATH, "utf8");
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    return null;
  }
}

function getDb() {
  if (!globalThis.__astralDemoDb) {
    globalThis.__astralDemoDb = loadDbFromDisk() ?? createSeedDatabase();
    saveDb(globalThis.__astralDemoDb);
  }

  return globalThis.__astralDemoDb;
}

export const getCurrentData = cache(async () => {
  if (hasSupabaseBackend) {
    return liveStore.getCurrentData();
  }
  return structuredClone(getDb());
});

export async function getUserByRole(role: AppUser["role"]) {
  if (hasSupabaseBackend) {
    return liveStore.getUserByRole(role);
  }
  return getDb().users.find((user) => user.role === role) ?? null;
}

export async function getUserById(id: string) {
  if (hasSupabaseBackend) {
    return liveStore.getUserById(id);
  }
  return getDb().users.find((user) => user.id === id) ?? null;
}

export async function getUserByCredentials(username: string, password: string) {
  if (hasSupabaseBackend) {
    return liveStore.getUserByCredentials(username, password);
  }
  return (
    getDb().users.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password
    ) ?? null
  );
}

export async function createProject(input: Omit<ProjectRecord, "id" | "healthScore" | "readinessScore" | "vendorName" | "location">) {
  if (hasSupabaseBackend) {
    return liveStore.createProject(input);
  }
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
  db.users = db.users.map((user) => {
    if (!user.assignedVendorIds.some((vendorId) => input.vendorIds.includes(vendorId))) {
      return user;
    }

    return {
      ...user,
      assignedProjectIds: user.assignedProjectIds.includes(project.id)
        ? user.assignedProjectIds
        : [...user.assignedProjectIds, project.id]
    };
  });
  saveDb(db);
  return project;
}

export async function updateProject(input: {
  projectId: string;
  name: string;
  category: string;
  subCategory: string;
  state: string;
  district: string;
  status: ProjectRecord["status"];
  reportingFrequency: string;
  vendorIds: string[];
  strategicTags: string[];
  emotionalTags: string[];
  budgetInr: number;
  internalOwnerId: string;
  beneficiaryTarget: number;
  projectBrief: string;
  startDate: string;
  endDate: string;
  requireAdminApproval: boolean;
}) {
  if (hasSupabaseBackend) {
    return liveStore.updateProject(input);
  }
  const db = getDb();
  const index = db.projects.findIndex((project) => project.id === input.projectId);
  if (index === -1) {
    return null;
  }

  const existing = db.projects[index];
  const vendors = db.vendors.filter((vendor) => input.vendorIds.includes(vendor.id));
  const vendorName = vendors.map((vendor) => vendor.name).join(", ") || "Unassigned vendor";
  const location = `${input.district}, ${input.state}`;

  db.projects[index] = {
    ...existing,
    ...input,
    vendorName,
    location
  };

  db.vendors = db.vendors.map((vendor) => {
    const shouldHaveProject = input.vendorIds.includes(vendor.id);
    const hasProject = vendor.assignedProjectIds.includes(input.projectId);

    if (shouldHaveProject && !hasProject) {
      return { ...vendor, assignedProjectIds: [...vendor.assignedProjectIds, input.projectId] };
    }

    if (!shouldHaveProject && hasProject) {
      return { ...vendor, assignedProjectIds: vendor.assignedProjectIds.filter((id) => id !== input.projectId) };
    }

    return vendor;
  });

  db.users = db.users.map((user) => {
    const managesVendor = user.assignedVendorIds.some((vendorId) => input.vendorIds.includes(vendorId));
    const assignedProjectIds = managesVendor
      ? user.assignedProjectIds.includes(input.projectId)
        ? user.assignedProjectIds
        : [...user.assignedProjectIds, input.projectId]
      : user.assignedProjectIds.filter((id) => id !== input.projectId || user.isSuperAdmin);

    return {
      ...user,
      assignedProjectIds
    };
  });

  db.updates = db.updates.map((update) =>
    update.projectId === input.projectId
      ? {
          ...update,
          projectName: input.name
        }
      : update
  );
  db.generatedContent = db.generatedContent.map((content) =>
    db.updates.some((update) => update.id === content.updateId && update.projectId === input.projectId)
      ? { ...content, projectName: input.name }
      : content
  );

  recomputeScores(db);
  saveDb(db);
  return db.projects[index];
}

export async function deleteProject(projectId: string) {
  if (hasSupabaseBackend) {
    return liveStore.deleteProject(projectId);
  }
  const db = getDb();
  const exists = db.projects.some((project) => project.id === projectId);
  if (!exists) {
    return false;
  }

  const updateIds = new Set(db.updates.filter((update) => update.projectId === projectId).map((update) => update.id));
  const contentIds = new Set(db.generatedContent.filter((content) => updateIds.has(content.updateId)).map((content) => content.id));

  db.projects = db.projects.filter((project) => project.id !== projectId);
  db.vendors = db.vendors.map((vendor) => ({
    ...vendor,
    assignedProjectIds: vendor.assignedProjectIds.filter((id) => id !== projectId)
  }));
  db.users = db.users.map((user) => ({
    ...user,
    assignedProjectIds: user.assignedProjectIds.filter((id) => id !== projectId)
  }));
  db.updates = db.updates.filter((update) => update.projectId !== projectId);
  db.approvals = db.approvals.filter((approval) => !updateIds.has(approval.updateId));
  db.generatedContent = db.generatedContent.filter((content) => !updateIds.has(content.updateId));
  db.distributionLog = db.distributionLog.filter((entry) => !updateIds.has(entry.updateId) && !contentIds.has(entry.contentId));

  recomputeScores(db);
  saveDb(db);
  return true;
}

export async function createVendor(input: Omit<VendorRecord, "id" | "assignedProjectIds" | "score">) {
  if (hasSupabaseBackend) {
    return liveStore.createVendor(input);
  }
  const db = getDb();
  const vendor: VendorRecord = {
    ...input,
    id: crypto.randomUUID(),
    assignedProjectIds: [],
    score: 50
  };
  db.vendors.unshift(vendor);
  saveDb(db);
  return vendor;
}

export async function createWorkspaceUser(input: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: AppUser["role"];
  assignedProjectIds: string[];
  assignedVendorIds: string[];
  managedByUserId: string;
}) {
  if (hasSupabaseBackend) {
    return liveStore.createWorkspaceUser(input);
  }
  const db = getDb();
  const user: AppUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName,
    email: input.email,
    username: input.username,
    password: input.password,
    role: input.role,
    assignedProjectIds: input.assignedProjectIds,
    assignedVendorIds: input.assignedVendorIds,
    managedByUserId: input.managedByUserId
  };
  db.users.unshift(user);
  saveDb(db);
  return user;
}

export async function updateWorkspaceUser(input: {
  userId: string;
  fullName: string;
  email: string;
  username: string;
  password?: string;
  role: AppUser["role"];
  assignedProjectIds: string[];
  assignedVendorIds: string[];
}) {
  if (hasSupabaseBackend) {
    return liveStore.updateWorkspaceUser(input);
  }
  const db = getDb();
  const index = db.users.findIndex((user) => user.id === input.userId);
  if (index === -1) {
    return null;
  }

  const existing = db.users[index];
  db.users[index] = {
    ...existing,
    fullName: input.fullName,
    email: input.email,
    username: input.username,
    password: input.password?.trim() ? input.password : existing.password,
    role: input.role,
    assignedProjectIds: input.assignedProjectIds,
    assignedVendorIds: input.assignedVendorIds
  };

  saveDb(db);
  return db.users[index];
}

export async function deleteWorkspaceUser(userId: string) {
  if (hasSupabaseBackend) {
    return liveStore.deleteWorkspaceUser(userId);
  }
  const db = getDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user || user.isSuperAdmin) {
    return false;
  }

  db.users = db.users.filter((entry) => entry.id !== userId);
  saveDb(db);
  return true;
}

export async function updateVendor(input: {
  vendorId: string;
  name: string;
  primaryContactName: string;
  email: string;
  whatsappPhone: string;
  organizationType: string;
  geographicalScope: string[];
  contractValidUntil: string;
  rateCardInr: number;
  notes: string;
}) {
  if (hasSupabaseBackend) {
    return liveStore.updateVendor(input);
  }
  const db = getDb();
  const index = db.vendors.findIndex((vendor) => vendor.id === input.vendorId);
  if (index === -1) {
    return null;
  }

  const existing = db.vendors[index];
  db.vendors[index] = {
    ...existing,
    ...input
  };

  db.projects = db.projects.map((project) =>
    project.vendorIds.includes(input.vendorId)
      ? {
          ...project,
          vendorName: project.vendorIds.length === 1 ? input.name : project.vendorName
        }
      : project
  );

  db.updates = db.updates.map((update) => (update.vendorId === input.vendorId ? { ...update, vendorName: input.name } : update));
  db.generatedContent = db.generatedContent.map((content) =>
    db.updates.some((update) => update.id === content.updateId && update.vendorId === input.vendorId)
      ? { ...content, vendorName: input.name }
      : content
  );

  saveDb(db);
  return db.vendors[index];
}

export async function deleteVendor(vendorId: string) {
  if (hasSupabaseBackend) {
    return liveStore.deleteVendor(vendorId);
  }
  const db = getDb();
  const vendor = db.vendors.find((entry) => entry.id === vendorId);
  if (!vendor) {
    return false;
  }

  db.vendors = db.vendors.filter((entry) => entry.id !== vendorId);
  db.projects = db.projects.map((project) =>
    project.vendorIds.includes(vendorId)
      ? {
          ...project,
          vendorIds: project.vendorIds.filter((id) => id !== vendorId),
          vendorName: project.vendorIds.length === 1 ? "Unassigned vendor" : project.vendorName
        }
      : project
  );
  db.users = db.users
    .map((user) => ({
      ...user,
      assignedVendorIds: user.assignedVendorIds.filter((id) => id !== vendorId)
    }))
    .filter((user) => !(user.role === "vendor" && user.assignedVendorIds.length === 0));

  recomputeScores(db);
  saveDb(db);
  return true;
}

export async function createUpdate(input: Omit<UpdateRecord, "id" | "readinessScore" | "status" | "revisionCount" | "createdAt">) {
  if (hasSupabaseBackend) {
    return liveStore.createUpdate(input);
  }
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
  saveDb(db);
  return update;
}

export async function deleteMediaAssetById(mediaAssetId: string) {
  if (hasSupabaseBackend) {
    return liveStore.deleteMediaAssetById(mediaAssetId);
  }
  const db = getDb();
  let removed = false;

  db.updates = db.updates.map((update) => {
    const nextMedia = update.media.filter((item) => item.id !== mediaAssetId);
    if (nextMedia.length !== update.media.length) {
      removed = true;
      return { ...update, media: nextMedia };
    }

    return update;
  });

  if (removed) {
    recomputeScores(db);
    saveDb(db);
  }

  return removed;
}

export async function findMediaAsset(mediaAssetId: string) {
  if (hasSupabaseBackend) {
    return liveStore.findMediaAsset(mediaAssetId);
  }
  const db = getDb();
  for (const update of db.updates) {
    const media = update.media.find((item) => item.id === mediaAssetId);
    if (media) {
      return { media, update };
    }
  }

  return null;
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
  if (hasSupabaseBackend) {
    return liveStore.recordApproval({
      updateId,
      reviewerId,
      action,
      stage,
      comment
    });
  }
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
  saveDb(db);
  return approval;
}

export async function generateContent(updateId: string) {
  if (hasSupabaseBackend) {
    return liveStore.generateContent(updateId);
  }
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
  saveDb(db);
  return content;
}

export async function distributeContent(request: DistributionRequestRecord) {
  if (hasSupabaseBackend) {
    return liveStore.distributeContent(request);
  }
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
  saveDb(db);
  return log;
}

export async function getDashboardData(session?: AppUser): Promise<DashboardData> {
  if (hasSupabaseBackend) {
    return liveStore.getDashboardData(session);
  }
  const db = getDb();
  recomputeScores(db);

  const visible = filterDataForUser(db, session);

  const metrics: MetricTile[] = [
    {
      label: "On-time vendor updates",
      value: `${Math.round((visible.updates.filter((update) => update.status !== "rejected").length / Math.max(visible.updates.length, 1)) * 100)}%`,
      trend: `${visible.updates.length} tracked updates`,
      tone: "positive"
    },
    {
      label: "Pending approvals",
      value: `${visible.updates.filter((update) => update.status === "pending" || update.status === "in_review").length}`,
      trend: `${visible.updates.filter((update) => update.status === "revision_requested").length} awaiting revision`,
      tone: "warning"
    },
    {
      label: "Generated content packages",
      value: `${visible.generatedContent.length}`,
      trend: `${visible.generatedContent.filter((entry) => new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`,
      tone: "positive"
    },
    {
      label: "Published deliveries",
      value: `${visible.distributionLog.length}`,
      trend: `${visible.distributionLog.filter((entry) => entry.channel === "telegram").length} Telegram sends`,
      tone: "neutral"
    }
  ];

  return {
    users: structuredClone(visible.users),
    vendors: structuredClone(visible.vendors),
    projects: structuredClone(visible.projects),
    updates: structuredClone(visible.updates),
    approvals: structuredClone(visible.approvals),
    generatedContent: structuredClone(visible.generatedContent),
    distributionLog: structuredClone(visible.distributionLog),
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

export async function getApprovalComments(updateId: string): Promise<ApprovalComment[]> {
  if (hasSupabaseBackend) {
    return liveStore.getApprovalComments(updateId);
  }
  return getDb()
    .approvals.filter((approval) => approval.updateId === updateId)
    .map((approval) => ({
      id: approval.id,
      author: approval.reviewerName,
      message: approval.comment ?? `${approval.action} at ${approval.stage} stage`,
      createdAt: approval.createdAt
    }));
}

function filterDataForUser(db: DemoDatabase, session?: AppUser) {
  if (!session || session.isSuperAdmin || session.role === "admin") {
    return {
      users: db.users,
      vendors: db.vendors,
      projects: db.projects,
      updates: db.updates,
      approvals: db.approvals,
      generatedContent: db.generatedContent,
      distributionLog: db.distributionLog
    };
  }

  const visibleProjectIds = new Set(session.assignedProjectIds);
  const visibleVendorIds = new Set(session.assignedVendorIds);

  if (session.role === "vendor") {
    db.projects
      .filter((project) => project.vendorIds.some((vendorId) => visibleVendorIds.has(vendorId)))
      .forEach((project) => visibleProjectIds.add(project.id));
  } else {
    db.projects
      .filter((project) => project.internalOwnerId === session.id)
      .forEach((project) => visibleProjectIds.add(project.id));
  }

  db.projects
    .filter((project) => visibleProjectIds.has(project.id))
    .flatMap((project) => project.vendorIds)
    .forEach((vendorId) => visibleVendorIds.add(vendorId));

  const projects = db.projects.filter((project) => visibleProjectIds.has(project.id));
  const vendors = db.vendors.filter((vendor) => visibleVendorIds.has(vendor.id));
  const updates = db.updates.filter(
    (update) => visibleProjectIds.has(update.projectId) || visibleVendorIds.has(update.vendorId) || update.submittedByUserId === session.id
  );
  const updateIds = new Set(updates.map((update) => update.id));
  const approvals = db.approvals.filter((approval) => updateIds.has(approval.updateId));
  const generatedContent = db.generatedContent.filter((content) => updateIds.has(content.updateId));
  const contentIds = new Set(generatedContent.map((content) => content.id));
  const distributionLog = db.distributionLog.filter((entry) => updateIds.has(entry.updateId) || contentIds.has(entry.contentId));

  return {
    users: db.users.filter((user) => user.id === session.id),
    vendors,
    projects,
    updates,
    approvals,
    generatedContent,
    distributionLog
  };
}
