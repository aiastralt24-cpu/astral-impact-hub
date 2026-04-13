import test from "node:test";
import assert from "node:assert/strict";

import { projectSchema, updateDraftSchema } from "../types/contracts.ts";

test("project schema accepts a valid project payload", () => {
  const parsed = projectSchema.parse({
    name: "Tadoba Waterhole Revival",
    category: "Wildlife",
    subCategory: "Waterhole",
    state: "Maharashtra",
    district: "Chandrapur",
    startDate: "2026-04-01",
    endDate: "2026-09-30",
    budgetInr: 2500000,
    reportingFrequency: "weekly",
    internalOwnerId: "11111111-1111-4111-8111-111111111111",
    assignedVendorIds: ["44444444-4444-4444-8444-444444444444"]
  });

  assert.equal(parsed.category, "Wildlife");
});

test("update draft schema blocks progress outside 0-100", () => {
  assert.throws(() =>
    updateDraftSchema.parse({
      projectId: "55555555-5555-4555-8555-555555555555",
      happenedAt: "2026-04-12",
      description: "Daily progress update",
      progressPercent: 140
    })
  );
});
