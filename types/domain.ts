export type AppRole = "admin" | "project_manager" | "vendor" | "content_team" | "leadership";
export type ProjectStatus = "draft" | "active" | "on_hold" | "at_risk" | "completed" | "archived";
export type UpdateStatus = "draft" | "pending" | "in_review" | "revision_requested" | "approved" | "rejected" | "published";
export type DistributionChannel = "telegram" | "whatsapp" | "instagram";
export type MediaStorageProvider = "supabase";

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: AppRole;
  assignedProjectIds: string[];
  assignedVendorIds: string[];
  managedByUserId?: string;
  isSuperAdmin?: boolean;
};

export type MetricTile = {
  label: string;
  value: string;
  trend: string;
  tone: "positive" | "warning" | "neutral";
};

export type VendorRecord = {
  id: string;
  name: string;
  primaryContactName: string;
  email: string;
  whatsappPhone: string;
  organizationType: string;
  geographicalScope: string[];
  assignedProjectIds: string[];
  contractValidUntil: string;
  rateCardInr: number;
  notes: string;
  score: number;
};

export type ProjectRecord = {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  state: string;
  district: string;
  location: string;
  status: ProjectStatus;
  healthScore: number;
  readinessScore: number;
  reportingFrequency: string;
  vendorName: string;
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
};

export type UpdateMediaRecord = {
  id: string;
  name: string;
  storageProvider: MediaStorageProvider;
  externalFileId: string;
  externalFolderId: string;
  externalUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedAt: string;
  caption?: string;
};

export type UpdateRecord = {
  id: string;
  projectId: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  submittedByUserId: string;
  happenedAt: string;
  description: string;
  beneficiariesCount?: number;
  beneficiaryType?: string;
  progressPercent: number;
  workDuration?: string;
  whyItMatters?: string;
  highlightMoment?: string;
  quote?: string;
  challenges?: string;
  nextSteps?: string;
  socialMediaWorthy: boolean;
  urgent: boolean;
  documentationOnly: boolean;
  sensitiveContent: boolean;
  media: UpdateMediaRecord[];
  readinessScore: number;
  status: UpdateStatus;
  revisionCount: number;
  createdAt: string;
};

export type ApprovalRecord = {
  id: string;
  updateId: string;
  reviewerId: string;
  reviewerName: string;
  action: "approve" | "request_revision" | "reject" | "escalate";
  stage: "manager" | "admin" | "system";
  comment?: string;
  createdAt: string;
};

export type ApprovalComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type GeneratedContentPackage = {
  emotionalHook: string;
  instagramCaptionShort: string;
  instagramCaptionLong: string;
  reelScript: string;
  carouselBreakdown: string[];
  telegramUpdate: string;
  whatsappDigest: string;
  csrSummary: string;
};

export type GeneratedContentRecord = GeneratedContentPackage & {
  id: string;
  updateId: string;
  projectName: string;
  vendorName: string;
  createdAt: string;
};

export type DistributionRequestRecord = {
  updateId: string;
  contentId: string;
  channel: DistributionChannel;
};

export type DistributionLogRecord = {
  id: string;
  updateId: string;
  contentId: string;
  channel: DistributionChannel;
  status: string;
  message: string;
  createdAt: string;
};
