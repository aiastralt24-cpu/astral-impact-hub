import test from "node:test";
import assert from "node:assert/strict";

import { validateBeneficiaryCount } from "../lib/domain/update-validation.ts";

test("accepts an empty or whole-number impact count", () => {
  assert.equal(validateBeneficiaryCount(""), null);
  assert.equal(validateBeneficiaryCount("35"), null);
  assert.equal(validateBeneficiaryCount("0"), null);
});

test("rejects decimal, negative, and non-numeric impact counts", () => {
  assert.match(validateBeneficiaryCount("3.5") ?? "", /whole number/i);
  assert.match(validateBeneficiaryCount("-1") ?? "", /whole number/i);
  assert.match(validateBeneficiaryCount("people") ?? "", /whole number/i);
});
