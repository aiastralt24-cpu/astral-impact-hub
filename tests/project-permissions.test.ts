import test from "node:test";
import assert from "node:assert/strict";

import { canCreateProject, canManageProject } from "../lib/auth/project-permissions.ts";
import type { AppUser } from "../types/domain.ts";

const csrAssociate: AppUser = {
  id: "44444444-4444-4444-8444-444444444444",
  fullName: "CSR Associate",
  email: "csr@example.com",
  username: "csr.associate",
  password: "test",
  role: "vendor",
  assignedProjectIds: ["77777777-7777-4777-8777-777777777777"],
  assignedVendorIds: ["66666666-6666-4666-8666-666666666666"]
};

test("CSR Associates can update and delete an assigned project", () => {
  assert.equal(canManageProject(csrAssociate, "77777777-7777-4777-8777-777777777777"), true);
});

test("CSR Associates cannot update or delete an unassigned project", () => {
  assert.equal(canManageProject(csrAssociate, "99999999-9999-4999-8999-999999999999"), false);
});

test("CSR Associates cannot create projects", () => {
  assert.equal(canCreateProject(csrAssociate), false);
});
