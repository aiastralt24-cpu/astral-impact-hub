import test from "node:test";
import assert from "node:assert/strict";

import { resolveAssignedProjectId } from "../lib/domain/project-selection.ts";

const projects = [{ id: "kanha" }, { id: "caracal" }];

test("keeps a currently assigned project", () => {
  assert.equal(resolveAssignedProjectId(projects, "caracal"), "caracal");
});

test("falls back when a saved project is no longer assigned", () => {
  assert.equal(resolveAssignedProjectId(projects, "old-project"), "kanha");
});

test("prefers a valid route project over a stale saved project", () => {
  assert.equal(resolveAssignedProjectId(projects, "kanha", "old-project"), "kanha");
});

test("returns an empty selection when the user has no assigned projects", () => {
  assert.equal(resolveAssignedProjectId([], "old-project"), "");
});
