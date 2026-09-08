import test from "node:test";
import assert from "node:assert/strict";

import { canAccessUpdate, getWorkspaceScope } from "../lib/auth/scope.ts";
import type { AppUser, ProjectRecord, UpdateRecord } from "../types/domain.ts";

const project: ProjectRecord = {
  id: "project-1",
  name: "Shared project",
  category: "Water",
  subCategory: "Access",
  state: "Maharashtra",
  district: "Pune",
  location: "Pune, Maharashtra",
  status: "active",
  healthScore: 80,
  readinessScore: 80,
  reportingFrequency: "weekly",
  vendorName: "Partner A, Partner B",
  vendorIds: ["partner-a", "partner-b"],
  strategicTags: [],
  emotionalTags: [],
  budgetInr: 0,
  internalOwnerId: "employee-1",
  beneficiaryTarget: 0,
  projectBrief: "",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  requireAdminApproval: false
};

const partnerUser: AppUser = {
  id: "partner-user-a",
  fullName: "Partner A user",
  email: "a@example.test",
  username: "partner-a",
  password: "not-used",
  role: "vendor",
  assignedProjectIds: [],
  assignedVendorIds: ["partner-a"]
};

const updateForPartnerA = { projectId: "project-1", vendorId: "partner-a" } as UpdateRecord;
const updateForPartnerB = { projectId: "project-1", vendorId: "partner-b" } as UpdateRecord;

test("a partner on a shared project cannot access another partner's update", () => {
  const scope = getWorkspaceScope(partnerUser, [project]);
  assert.deepEqual([...scope.projectIds], ["project-1"]);
  assert.deepEqual([...scope.partnerIds], ["partner-a"]);
  assert.equal(canAccessUpdate(partnerUser, [project], updateForPartnerA), true);
  assert.equal(canAccessUpdate(partnerUser, [project], updateForPartnerB), false);
});

test("an employee can access only the partner explicitly assigned to them", () => {
  const employee: AppUser = {
    ...partnerUser,
    id: "employee-1",
    role: "project_manager",
    assignedVendorIds: ["partner-a"]
  };

  assert.equal(canAccessUpdate(employee, [project], updateForPartnerA), true);
  assert.equal(canAccessUpdate(employee, [project], updateForPartnerB), false);
});

test("an internal project update is visible to its assigned employee", () => {
  const employee: AppUser = {
    ...partnerUser,
    id: "employee-1",
    role: "project_manager",
    assignedVendorIds: []
  };
  const internalProject = {
    ...project,
    id: "internal-project",
    vendorIds: [],
    vendorName: "Managed internally",
    internalOwnerId: employee.id
  };

  assert.equal(
    canAccessUpdate(employee, [internalProject], { projectId: internalProject.id, vendorId: "" }),
    true
  );
});
