const MAX_DATABASE_INTEGER = 2_147_483_647;

export function validateBeneficiaryCount(value: string) {
  if (!value.trim()) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0 || count > MAX_DATABASE_INTEGER) {
    return "People or outcomes reached must be a whole number.";
  }
  return null;
}
