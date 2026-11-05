export const MAX_MEDIA_FILE_BYTES = 25 * 1024 * 1024;

// Keep multipart submissions below common serverless request limits.
// Large-media support should use direct-to-storage signed uploads instead.
export const MAX_MEDIA_REQUEST_BYTES = Math.floor(3.5 * 1024 * 1024);

export function formatMediaLimit(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
}
