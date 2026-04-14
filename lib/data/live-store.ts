import "server-only";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import { AnthropicContentProvider } from "@/lib/ai/provider";
import { computeProjectHealth, computeReadinessScore, computeVendorScore } from "@/lib/domain/scoring";
import { createServiceRoleClient } from "@/lib/supabase/server";
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

declare global {
  var __astralSupabaseSeedPromise: Promise<void> | undefined;
}

const DEMO_DB_PATH = join(process.cwd(), ".data", "demo-db.json");

function loadBootstrapData(): DemoDatabase {
  if (existsSync(DEMO_DB_PATH)) {
    return JSON.parse(readFileSync(DEMO_DB_PATH, "utf8")) as DemoDatabase;
  }

  return {
    users: [
      {
        id: crypto.randomUUID(),
        fullName: "Super Admin",
        email: "superadmin@astral.test",
        username: "superadmin",
        password: "superadmin@321",
        role: "admin",
        assignedProjectIds: [],
        assignedVendorIds: [],
        isSuperAdmin: true
      }
    ],
    vendors: [],
    projects: [],
    updates: [],
    approvals: [],
    generatedContent: [],
    distributionLog: []
  };
}

function deriveProjectLocation(project: { district: string; state: string }) {
  return `${project.district}, ${project.state}`;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

async function ensureSeeded() {
  if (!globalThis.__astralSupabaseSeedPromise) {
    globalThis.__astralSupabaseSeedPromise = (async () => {
      const supabase = createServiceRoleClient();
      const { count, error } = await supabase.from("users").select("id", { count: "exact", head: true });
      if (error) {
        throw error;
      }
      if ((count ?? 0) > 0) {
        return;
      }

      const seed = loadBootstrapData();

      const { error: usersError } = await supabase.from("users").insert(
        seed.users.map((user) => ({
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          username: user.username,
          password: user.password,
          role: user.role,
          assigned_project_ids: user.assignedProjectIds,
          assigned_vendor_ids: user.assignedVendorIds,
          managed_by_user_id: user.managedByUserId ?? null,
          is_super_admin: Boolean(user.isSuperAdmin)
        }))
      );
      if (usersError) throw usersError;

      if (seed.vendors.length > 0) {
        const { error: vendorsError } = await supabase.from("vendors").insert(
          seed.vendors.map((vendor) => ({
            id: vendor.id,
            name: vendor.name,
            primary_contact_name: vendor.primaryContactName,
            email: vendor.email || null,
            whatsapp_phone: vendor.whatsappPhone || null,
            organization_type: vendor.organizationType || null,
            geographical_scope: vendor.geographicalScope,
            contract_valid_until: vendor.contractValidUntil || null,
            rate_card_inr: vendor.rateCardInr ?? null,
            notes: vendor.notes || null
          }))
        );
        if (vendorsError) throw vendorsError;
      }

      if (seed.projects.length > 0) {
        const { error: projectsError } = await supabase.from("projects").insert(
          seed.projects.map((project) => ({
            id: project.id,
            name: project.name,
            category: project.category,
            sub_category: project.subCategory,
            state: project.state,
            district: project.district,
            start_date: project.startDate,
            end_date: project.endDate,
            budget_inr: project.budgetInr,
            reporting_frequency: project.reportingFrequency,
            internal_owner_id: project.internalOwnerId || null,
            project_brief: project.projectBrief || null,
            beneficiary_target: project.beneficiaryTarget ?? null,
            strategic_tags: project.strategicTags,
            emotional_tags: project.emotionalTags,
            status: project.status,
            health_score: project.healthScore,
            content_readiness_average: project.readinessScore,
            require_admin_approval: project.requireAdminApproval
          }))
        );
        if (projectsError) throw projectsError;

        const links = seed.projects.flatMap((project) =>
          project.vendorIds.map((vendorId) => ({
            project_id: project.id,
            vendor_id: vendorId
          }))
        );
        if (links.length > 0) {
          const { error: linksError } = await supabase.from("project_vendors").insert(links);
          if (linksError) throw linksError;
        }
      }

      if (seed.updates.length > 0) {
        const { error: updatesError } = await supabase.from("updates").insert(
          seed.updates.map((update) => ({
            id: update.id,
            project_id: update.projectId,
            vendor_id: update.vendorId || null,
            submitted_by_user_id: update.submittedByUserId || null,
            happened_at: update.happenedAt,
            description: update.description,
            beneficiaries_count: update.beneficiariesCount ?? null,
            beneficiary_type: update.beneficiaryType ?? null,
            progress_percent: update.progressPercent,
            work_duration: update.workDuration || null,
            why_it_matters: update.whyItMatters || null,
            highlight_moment: update.highlightMoment || null,
            quote: update.quote || null,
            challenges: update.challenges || null,
            next_steps: update.nextSteps || null,
            social_media_worthy: update.socialMediaWorthy,
            urgent: update.urgent,
            documentation_only: update.documentationOnly,
            sensitive_content: update.sensitiveContent,
            readiness_score: update.readinessScore,
            revision_count: update.revisionCount,
            status: update.status,
            created_at: update.createdAt
          }))
        );
        if (updatesError) throw updatesError;

        const mediaAssets = seed.updates.flatMap((update) =>
          update.media.map((media) => ({
            id: media.id,
            update_id: update.id,
            storage_path: `${media.externalFolderId}/${media.externalFileId}-${media.name}`,
            original_filename: media.name,
            mime_type: media.mimeType,
            caption: media.caption ?? null,
            checksum: media.externalFileId,
            created_at: media.uploadedAt,
            storage_provider: media.storageProvider,
            external_file_id: media.externalFileId,
            external_folder_id: media.externalFolderId,
            external_url: media.externalUrl,
            size_bytes: media.sizeBytes,
            uploaded_by_user_id: media.uploadedByUserId,
            uploaded_at: media.uploadedAt
          }))
        );

        if (mediaAssets.length > 0) {
          const { error: mediaError } = await supabase.from("media_assets").insert(mediaAssets);
          if (mediaError) throw mediaError;
        }
      }
    })();
  }

  await globalThis.__astralSupabaseSeedPromise;
}

async function fetchDatabase(): Promise<DemoDatabase> {
  await ensureSeeded();
  const supabase = createServiceRoleClient();

  const [usersRes, vendorsRes, projectsRes, linksRes, updatesRes, mediaRes, approvalsRes, generatedRes, distributionRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_vendors").select("*"),
    supabase.from("updates").select("*").order("created_at", { ascending: false }),
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").order("created_at", { ascending: false }),
    supabase.from("generated_content").select("*").order("created_at", { ascending: false }),
    supabase.from("distribution_log").select("*").order("created_at", { ascending: false })
  ]);

  for (const result of [usersRes, vendorsRes, projectsRes, linksRes, updatesRes, mediaRes, approvalsRes, generatedRes, distributionRes]) {
    if (result.error) throw result.error;
  }

  const usersRows = usersRes.data ?? [];
  const vendorsRows = vendorsRes.data ?? [];
  const projectRows = projectsRes.data ?? [];
  const linkRows = linksRes.data ?? [];
  const updateRows = updatesRes.data ?? [];
  const mediaRows = mediaRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];
  const generatedRows = generatedRes.data ?? [];
  const distributionRows = distributionRes.data ?? [];

  const users: AppUser[] = usersRows.map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    username: row.username,
    password: row.password,
    role: row.role,
    assignedProjectIds: row.assigned_project_ids ?? [],
    assignedVendorIds: row.assigned_vendor_ids ?? [],
    managedByUserId: row.managed_by_user_id ?? undefined,
    isSuperAdmin: row.is_super_admin ?? false
  }));

  const vendors: VendorRecord[] = vendorsRows.map((row: any) => ({
    id: row.id,
    name: row.name,
    primaryContactName: row.primary_contact_name,
    email: row.email ?? "",
    whatsappPhone: row.whatsapp_phone ?? "",
    organizationType: row.organization_type ?? "",
    geographicalScope: row.geographical_scope ?? [],
    assignedProjectIds: linkRows.filter((link: any) => link.vendor_id === row.id).map((link: any) => link.project_id),
    contractValidUntil: row.contract_valid_until ?? "",
    rateCardInr: Number(row.rate_card_inr ?? 0),
    notes: row.notes ?? "",
    score: 0
  }));

  const projects: ProjectRecord[] = projectRows.map((row: any) => {
    const vendorIds = linkRows.filter((link: any) => link.project_id === row.id).map((link: any) => link.vendor_id);
    const vendorNames = vendors.filter((vendor) => vendorIds.includes(vendor.id)).map((vendor) => vendor.name);
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      subCategory: row.sub_category,
      state: row.state,
      district: row.district,
      location: deriveProjectLocation(row),
      status: row.status,
      healthScore: row.health_score ?? 0,
      readinessScore: row.content_readiness_average ?? 0,
      reportingFrequency: row.reporting_frequency,
      vendorName: vendorNames.join(", ") || "Unassigned vendor",
      vendorIds,
      strategicTags: row.strategic_tags ?? [],
      emotionalTags: row.emotional_tags ?? [],
      budgetInr: Number(row.budget_inr ?? 0),
      internalOwnerId: row.internal_owner_id ?? "",
      beneficiaryTarget: Number(row.beneficiary_target ?? 0),
      projectBrief: row.project_brief ?? "",
      startDate: row.start_date,
      endDate: row.end_date,
      requireAdminApproval: row.require_admin_approval ?? false
    };
  });

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  const updates: UpdateRecord[] = updateRows.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    projectName: projectMap.get(row.project_id)?.name ?? "Unknown project",
    vendorId: row.vendor_id ?? "",
    vendorName: vendorMap.get(row.vendor_id)?.name ?? "Unknown vendor",
    submittedByUserId: row.submitted_by_user_id ?? "",
    happenedAt: row.happened_at,
    description: row.description,
    beneficiariesCount: row.beneficiaries_count ?? undefined,
    beneficiaryType: nullableString(row.beneficiary_type),
    progressPercent: row.progress_percent,
    workDuration: nullableString(row.work_duration),
    whyItMatters: nullableString(row.why_it_matters),
    highlightMoment: nullableString(row.highlight_moment),
    quote: nullableString(row.quote),
    challenges: nullableString(row.challenges),
    nextSteps: nullableString(row.next_steps),
    socialMediaWorthy: row.social_media_worthy ?? false,
    urgent: row.urgent ?? false,
    documentationOnly: row.documentation_only ?? false,
    sensitiveContent: row.sensitive_content ?? false,
    media: mediaRows
      .filter((asset: any) => asset.update_id === row.id)
      .map((asset: any) => ({
        id: asset.id,
        name: asset.original_filename,
        caption: asset.caption ?? undefined,
        storageProvider: "supabase",
        externalFileId: asset.external_file_id ?? asset.id,
        externalFolderId: asset.external_folder_id ?? "project-media/projects/unassigned",
        externalUrl: asset.external_url ?? `supabase://project-media/projects/unassigned/${asset.id}`,
        mimeType: asset.mime_type,
        sizeBytes: Number(asset.size_bytes ?? 0),
        uploadedByUserId: asset.uploaded_by_user_id ?? row.submitted_by_user_id ?? "",
        uploadedAt: asset.uploaded_at ?? asset.created_at ?? row.created_at
      })),
    readinessScore: row.readiness_score ?? 0,
    status: row.status,
    revisionCount: row.revision_count ?? 0,
    createdAt: row.created_at
  }));

  const generatedContent: GeneratedContentRecord[] = generatedRows.map((row: any) => {
    const update = updates.find((item) => item.id === row.update_id);
    return {
      id: row.id,
      updateId: row.update_id,
      projectName: update?.projectName ?? "Unknown project",
      vendorName: update?.vendorName ?? "Unknown vendor",
      emotionalHook: row.emotional_hook,
      instagramCaptionShort: row.instagram_caption_short,
      instagramCaptionLong: row.instagram_caption_long,
      reelScript: row.reel_script,
      carouselBreakdown: row.carousel_breakdown ?? [],
      telegramUpdate: row.telegram_update,
      whatsappDigest: row.whatsapp_digest,
      csrSummary: row.csr_summary,
      createdAt: row.created_at
    };
  });

  const approvals: ApprovalRecord[] = approvalRows.map((row: any) => ({
    id: row.id,
    updateId: row.update_id,
    reviewerId: row.reviewer_user_id ?? "",
    reviewerName: userMap.get(row.reviewer_user_id)?.fullName ?? "Unknown reviewer",
    action: row.action,
    stage: row.stage,
    comment: row.comment ?? undefined,
    createdAt: row.created_at
  }));

  const distributionLog: DistributionLogRecord[] = distributionRows.map((row: any) => ({
    id: row.id,
    updateId: row.update_id,
    contentId: row.generated_content_id ?? "",
    channel: row.channel,
    status: row.status,
    message: row.payload?.message ?? row.status,
    createdAt: row.created_at
  }));

  const db: DemoDatabase = {
    users,
    vendors,
    projects,
    updates,
    approvals,
    generatedContent,
    distributionLog
  };

  recomputeScores(db);
  return db;
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
    db.projects.filter((project) => project.internalOwnerId === session.id).forEach((project) => visibleProjectIds.add(project.id));
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

export const getCurrentData = cache(async () => structuredClone(await fetchDatabase()));

export async function getUserByRole(role: AppUser["role"]) {
  return (await fetchDatabase()).users.find((user) => user.role === role) ?? null;
}

export async function getUserById(id: string) {
  return (await fetchDatabase()).users.find((user) => user.id === id) ?? null;
}

export async function getUserByCredentials(username: string, password: string) {
  return (
    (await fetchDatabase()).users.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password
    ) ?? null
  );
}

export async function createProject(input: Omit<ProjectRecord, "id" | "healthScore" | "readinessScore" | "vendorName" | "location">) {
  const supabase = createServiceRoleClient();
  const { data: projectRow, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      category: input.category,
      sub_category: input.subCategory,
      state: input.state,
      district: input.district,
      start_date: input.startDate,
      end_date: input.endDate,
      budget_inr: input.budgetInr,
      reporting_frequency: input.reportingFrequency,
      internal_owner_id: input.internalOwnerId || null,
      project_brief: input.projectBrief || null,
      beneficiary_target: input.beneficiaryTarget,
      strategic_tags: input.strategicTags,
      emotional_tags: input.emotionalTags,
      status: input.status,
      require_admin_approval: input.requireAdminApproval
    })
    .select("*")
    .single();
  if (error) throw error;

  if (input.vendorIds.length > 0) {
    const { error: linkError } = await supabase.from("project_vendors").insert(
      input.vendorIds.map((vendorId) => ({
        project_id: projectRow.id,
        vendor_id: vendorId
      }))
    );
    if (linkError) throw linkError;
  }

  const db = await fetchDatabase();
  const usersToUpdate = db.users.filter((user) => user.assignedVendorIds.some((vendorId) => input.vendorIds.includes(vendorId)));
  for (const user of usersToUpdate) {
    const nextProjects = user.assignedProjectIds.includes(projectRow.id)
      ? user.assignedProjectIds
      : [...user.assignedProjectIds, projectRow.id];
    await supabase.from("users").update({ assigned_project_ids: nextProjects }).eq("id", user.id);
  }

  const refreshed = await fetchDatabase();
  return refreshed.projects.find((project) => project.id === projectRow.id) ?? null;
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
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: input.name,
      category: input.category,
      sub_category: input.subCategory,
      state: input.state,
      district: input.district,
      status: input.status,
      reporting_frequency: input.reportingFrequency,
      budget_inr: input.budgetInr,
      internal_owner_id: input.internalOwnerId || null,
      beneficiary_target: input.beneficiaryTarget,
      project_brief: input.projectBrief || null,
      strategic_tags: input.strategicTags,
      emotional_tags: input.emotionalTags,
      start_date: input.startDate,
      end_date: input.endDate,
      require_admin_approval: input.requireAdminApproval
    })
    .eq("id", input.projectId);
  if (error) throw error;

  await supabase.from("project_vendors").delete().eq("project_id", input.projectId);
  if (input.vendorIds.length > 0) {
    const { error: linkError } = await supabase.from("project_vendors").insert(
      input.vendorIds.map((vendorId) => ({
        project_id: input.projectId,
        vendor_id: vendorId
      }))
    );
    if (linkError) throw linkError;
  }

  const db = await fetchDatabase();
  for (const user of db.users) {
    const managesVendor = user.assignedVendorIds.some((vendorId) => input.vendorIds.includes(vendorId));
    const assignedProjectIds = managesVendor
      ? user.assignedProjectIds.includes(input.projectId)
        ? user.assignedProjectIds
        : [...user.assignedProjectIds, input.projectId]
      : user.assignedProjectIds.filter((id) => id !== input.projectId || Boolean(user.isSuperAdmin));
    await supabase.from("users").update({ assigned_project_ids: assignedProjectIds }).eq("id", user.id);
  }

  const refreshed = await fetchDatabase();
  return refreshed.projects.find((project) => project.id === input.projectId) ?? null;
}

export async function deleteProject(projectId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;

  const db = await fetchDatabase();
  for (const user of db.users.filter((user) => user.assignedProjectIds.includes(projectId))) {
    await supabase
      .from("users")
      .update({ assigned_project_ids: user.assignedProjectIds.filter((id) => id !== projectId) })
      .eq("id", user.id);
  }

  return true;
}

export async function createVendor(input: Omit<VendorRecord, "id" | "assignedProjectIds" | "score">) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      name: input.name,
      primary_contact_name: input.primaryContactName,
      email: input.email || null,
      whatsapp_phone: input.whatsappPhone || null,
      organization_type: input.organizationType || null,
      geographical_scope: input.geographicalScope,
      contract_valid_until: input.contractValidUntil || null,
      rate_card_inr: input.rateCardInr,
      notes: input.notes || null
    })
    .select("*")
    .single();
  if (error) throw error;

  const refreshed = await fetchDatabase();
  return refreshed.vendors.find((vendor) => vendor.id === data.id) ?? null;
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
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      full_name: input.fullName,
      email: input.email,
      username: input.username,
      password: input.password,
      role: input.role,
      assigned_project_ids: input.assignedProjectIds,
      assigned_vendor_ids: input.assignedVendorIds,
      managed_by_user_id: input.managedByUserId,
      is_super_admin: false
    })
    .select("*")
    .single();
  if (error) throw error;

  const refreshed = await fetchDatabase();
  return refreshed.users.find((user) => user.id === data.id) ?? null;
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
  const supabase = createServiceRoleClient();
  const existing = await getUserById(input.userId);
  if (!existing) return null;
  const { error } = await supabase
    .from("users")
    .update({
      full_name: input.fullName,
      email: input.email,
      username: input.username,
      password: input.password?.trim() ? input.password : existing.password,
      role: input.role,
      assigned_project_ids: input.assignedProjectIds,
      assigned_vendor_ids: input.assignedVendorIds
    })
    .eq("id", input.userId);
  if (error) throw error;
  return getUserById(input.userId);
}

export async function deleteWorkspaceUser(userId: string) {
  const existing = await getUserById(userId);
  if (!existing || existing.isSuperAdmin) return false;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw error;
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
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: input.name,
      primary_contact_name: input.primaryContactName,
      email: input.email || null,
      whatsapp_phone: input.whatsappPhone || null,
      organization_type: input.organizationType || null,
      geographical_scope: input.geographicalScope,
      contract_valid_until: input.contractValidUntil || null,
      rate_card_inr: input.rateCardInr,
      notes: input.notes || null
    })
    .eq("id", input.vendorId);
  if (error) throw error;
  const refreshed = await fetchDatabase();
  return refreshed.vendors.find((vendor) => vendor.id === input.vendorId) ?? null;
}

export async function deleteVendor(vendorId: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("project_vendors").delete().eq("vendor_id", vendorId);
  await supabase.from("updates").update({ vendor_id: null }).eq("vendor_id", vendorId);

  const db = await fetchDatabase();
  for (const user of db.users.filter((entry) => entry.assignedVendorIds.includes(vendorId))) {
    const nextVendorIds = user.assignedVendorIds.filter((id) => id !== vendorId);
    await supabase
      .from("users")
      .update({
        assigned_vendor_ids: nextVendorIds,
        assigned_project_ids: user.assignedProjectIds.filter((projectId) =>
          db.projects.some((project) => project.id === projectId && project.vendorIds.some((id) => id !== vendorId))
        )
      })
      .eq("id", user.id);
  }

  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
  if (error) throw error;
  return true;
}

export async function createUpdate(input: Omit<UpdateRecord, "id" | "readinessScore" | "status" | "revisionCount" | "createdAt">) {
  const supabase = createServiceRoleClient();
  const readinessScore = computeReadinessScore({
    description: input.description,
    whyItMatters: input.whyItMatters,
    highlightMoment: input.highlightMoment,
    quote: input.quote,
    progressPercent: input.progressPercent,
    media: input.media,
    socialMediaWorthy: input.socialMediaWorthy
  });

  const { data, error } = await supabase
    .from("updates")
    .insert({
      project_id: input.projectId,
      vendor_id: input.vendorId || null,
      submitted_by_user_id: input.submittedByUserId || null,
      happened_at: input.happenedAt,
      description: input.description,
      beneficiaries_count: input.beneficiariesCount ?? null,
      beneficiary_type: input.beneficiaryType ?? null,
      progress_percent: input.progressPercent,
      work_duration: input.workDuration ?? null,
      why_it_matters: input.whyItMatters ?? null,
      highlight_moment: input.highlightMoment ?? null,
      quote: input.quote ?? null,
      challenges: input.challenges ?? null,
      next_steps: input.nextSteps ?? null,
      social_media_worthy: input.socialMediaWorthy,
      urgent: input.urgent,
      documentation_only: input.documentationOnly,
      sensitive_content: input.sensitiveContent,
      readiness_score: readinessScore,
      status: "pending",
      revision_count: 0
    })
    .select("*")
    .single();
  if (error) throw error;

  if (input.media.length > 0) {
    const { error: mediaError } = await supabase.from("media_assets").insert(
      input.media.map((media) => ({
        update_id: data.id,
        storage_path: `${media.externalFolderId}/${media.externalFileId}-${media.name}`,
        original_filename: media.name,
        mime_type: media.mimeType,
        caption: media.caption ?? null,
        checksum: media.externalFileId,
        storage_provider: media.storageProvider,
        external_file_id: media.externalFileId,
        external_folder_id: media.externalFolderId,
        external_url: media.externalUrl,
        size_bytes: media.sizeBytes,
        uploaded_by_user_id: media.uploadedByUserId || null,
        uploaded_at: media.uploadedAt
      }))
    );
    if (mediaError) throw mediaError;
  }

  const refreshed = await fetchDatabase();
  return refreshed.updates.find((update) => update.id === data.id) ?? null;
}

export async function deleteMediaAssetById(mediaAssetId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("media_assets").delete().eq("id", mediaAssetId);
  if (error) throw error;
  return true;
}

export async function findMediaAsset(mediaAssetId: string) {
  const db = await fetchDatabase();
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
  const supabase = createServiceRoleClient();
  const reviewer = await getUserById(reviewerId);
  if (!reviewer) return null;

  const { data, error } = await supabase
    .from("approvals")
    .insert({
      update_id: updateId,
      reviewer_user_id: reviewerId,
      action,
      stage,
      comment: comment || null
    })
    .select("*")
    .single();
  if (error) throw error;

  const nextStatus =
    action === "approve"
      ? "approved"
      : action === "request_revision"
        ? "revision_requested"
        : action === "reject"
          ? "rejected"
          : "in_review";

  const currentDb = await fetchDatabase();
  const currentUpdate = currentDb.updates.find((entry) => entry.id === updateId);
  const revisionCount = action === "request_revision" ? (currentUpdate?.revisionCount ?? 0) + 1 : currentUpdate?.revisionCount ?? 0;

  await supabase.from("updates").update({ status: nextStatus, revision_count: revisionCount }).eq("id", updateId);

  return {
    id: data.id,
    updateId,
    reviewerId,
    reviewerName: reviewer.fullName,
    action,
    stage,
    comment: comment || undefined,
    createdAt: data.created_at
  } satisfies ApprovalRecord;
}

export async function generateContent(updateId: string) {
  const supabase = createServiceRoleClient();
  const db = await fetchDatabase();
  const update = db.updates.find((entry) => entry.id === updateId);
  const project = db.projects.find((entry) => entry.id === update?.projectId);
  if (!update || !project) return null;

  const existing = db.generatedContent.find((entry) => entry.updateId === updateId);
  if (existing) return existing;

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

  const { data, error } = await supabase
    .from("generated_content")
    .insert({
      update_id: updateId,
      prompt_version: "v1.0",
      emotional_hook: generated.emotionalHook,
      instagram_caption_short: generated.instagramCaptionShort,
      instagram_caption_long: generated.instagramCaptionLong,
      reel_script: generated.reelScript,
      carousel_breakdown: generated.carouselBreakdown,
      telegram_update: generated.telegramUpdate,
      whatsapp_digest: generated.whatsappDigest,
      csr_summary: generated.csrSummary
    })
    .select("*")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    updateId,
    projectName: project.name,
    vendorName: update.vendorName,
    createdAt: data.created_at,
    ...generated
  } satisfies GeneratedContentRecord;
}

export async function distributeContent(request: DistributionRequestRecord) {
  const supabase = createServiceRoleClient();
  const generatedContent = (await fetchDatabase()).generatedContent.find((entry) => entry.id === request.contentId);
  if (!generatedContent) return null;

  const payload = {
    message: `${request.channel} delivery ${request.channel === "telegram" ? "queued" : "simulated"} successfully`
  };

  const { data, error } = await supabase
    .from("distribution_log")
    .insert({
      update_id: request.updateId,
      generated_content_id: request.contentId,
      channel: request.channel,
      status: "sent",
      payload
    })
    .select("*")
    .single();
  if (error) throw error;

  if (request.channel === "telegram") {
    await supabase.from("updates").update({ status: "published" }).eq("id", request.updateId);
  }

  return {
    id: data.id,
    updateId: request.updateId,
    contentId: request.contentId,
    channel: request.channel,
    status: "sent",
    message: payload.message,
    createdAt: data.created_at
  } satisfies DistributionLogRecord;
}

export async function getDashboardData(session?: AppUser): Promise<DashboardData> {
  const db = await fetchDatabase();
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

export async function getApprovalComments(updateId: string): Promise<ApprovalComment[]> {
  return (await fetchDatabase())
    .approvals.filter((approval) => approval.updateId === updateId)
    .map((approval) => ({
      id: approval.id,
      author: approval.reviewerName,
      message: approval.comment ?? `${approval.action} at ${approval.stage} stage`,
      createdAt: approval.createdAt
    }));
}
