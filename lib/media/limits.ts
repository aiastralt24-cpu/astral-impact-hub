export const MAX_MEDIA_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_MEDIA_FILES_PER_UPDATE = 10;

export function formatMediaLimit(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
}
