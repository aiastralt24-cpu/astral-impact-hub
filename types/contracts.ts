import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(3).max(80),
  category: z.string(),
  subCategory: z.string(),
  state: z.string(),
  district: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  budgetInr: z.number().nonnegative(),
  reportingFrequency: z.enum(["daily", "weekly", "fortnightly", "monthly"]),
  internalOwnerId: z.string().uuid(),
  assignedVendorIds: z.array(z.string().uuid()).min(1),
  strategicTags: z.array(z.string()).default([]),
  emotionalTags: z.array(z.string()).default([]),
  projectBrief: z.string().max(500).optional(),
  beneficiaryTarget: z.number().int().nonnegative().optional()
});

export const vendorAssignmentSchema = z.object({
  vendorId: z.string().uuid(),
  projectIds: z.array(z.string().uuid()).min(1),
  contractValidUntil: z.string().optional(),
  rateCardInr: z.number().nonnegative().optional()
});

export const updateDraftSchema = z.object({
  projectId: z.string().uuid(),
  happenedAt: z.string(),
  description: z.string().max(300),
  beneficiariesCount: z.number().int().nonnegative().optional(),
  beneficiaryType: z.string().optional(),
  milestoneId: z.string().uuid().optional(),
  progressPercent: z.number().min(0).max(100),
  workDuration: z.enum(["half_day", "full_day", "multiple_days"]).optional(),
  whyItMatters: z.string().max(200).optional(),
  highlightMoment: z.string().max(200).optional(),
  quote: z.string().max(100).optional(),
  challenges: z.string().max(150).optional(),
  nextSteps: z.string().max(150).optional(),
  socialMediaWorthy: z.boolean().default(false),
  urgent: z.boolean().default(false),
  documentationOnly: z.boolean().default(false),
  sensitiveContent: z.boolean().default(false)
});

export const approvalActionSchema = z.object({
  updateId: z.string().uuid(),
  stage: z.enum(["manager", "admin", "system"]),
  action: z.enum(["approve", "request_revision", "reject", "escalate"]),
  comment: z.string().max(500).optional(),
  fieldComments: z.array(z.object({
    fieldKey: z.string(),
    comment: z.string().max(280)
  })).default([])
});

export const generatedContentSchema = z.object({
  emotionalHook: z.string(),
  instagramCaptionShort: z.string(),
  instagramCaptionLong: z.string(),
  reelScript: z.string(),
  carouselBreakdown: z.array(z.string()),
  telegramUpdate: z.string(),
  whatsappDigest: z.string(),
  csrSummary: z.string()
});

export const distributionRequestSchema = z.object({
  updateId: z.string().uuid(),
  channel: z.enum(["telegram", "whatsapp", "instagram"]),
  scheduledFor: z.string().optional(),
  contentId: z.string().uuid().optional()
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type VendorAssignmentInput = z.infer<typeof vendorAssignmentSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
export type GeneratedContentInput = z.infer<typeof generatedContentSchema>;
export type DistributionRequestInput = z.infer<typeof distributionRequestSchema>;
