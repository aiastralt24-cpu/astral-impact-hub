const MAX_DATABASE_INTEGER = 2_147_483_647;

export function validateBeneficiaryCount(value: string) {
  if (!value.trim()) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0 || count > MAX_DATABASE_INTEGER) {
    return "People or outcomes reached must be a whole number.";
  }
  return null;
}

export function getUpdateErrorMessage(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid input syntax for type integer")) return "People or outcomes reached must be a whole number.";
  if (normalized.includes("failed to fetch") || normalized.includes("fetch failed") || normalized.includes("network")) {
    return "The connection was interrupted. Check your internet connection and try again.";
  }
  if (normalized.includes("jwt") || normalized.includes("unauthorized") || normalized.includes("session")) {
    return "Your session has expired. Refresh the page, sign in again, and retry.";
  }
  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "Your account does not have permission to update this project. Ask an administrator to check the assignment.";
  }
  if (normalized.includes("duplicate") || normalized.includes("already exists")) {
    return "This file or update already exists. Refresh the page before trying again.";
  }
  if (
    message.startsWith("Could not upload") ||
    message.startsWith("Could not prepare") ||
    message.includes("did not finish uploading") ||
    message.includes("larger than") ||
    message.includes("no longer available") ||
    message.includes("whole number")
  ) {
    return message;
  }

  return "We could not submit this update. Your draft is still saved; refresh the page and try again.";
}
