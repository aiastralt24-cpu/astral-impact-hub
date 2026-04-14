import "server-only";

import type { AppUser, MediaStorageProvider, ProjectRecord, UpdateMediaRecord, VendorRecord } from "@/types/domain";

type MediaUploadInput = {
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  caption?: string;
};

type MediaUploadContext = {
  actor: AppUser;
  project: ProjectRecord;
  vendor: VendorRecord;
};

type MediaAccessContext = {
  actor: AppUser;
};

type MediaStorageService = {
  uploadMedia(files: MediaUploadInput[], context: MediaUploadContext): Promise<UpdateMediaRecord[]>;
  deleteMedia(media: UpdateMediaRecord, context: MediaAccessContext): Promise<boolean>;
  getMediaAccessUrl(media: UpdateMediaRecord, context: MediaAccessContext): Promise<string>;
  resolveProjectFolder(project: ProjectRecord, vendor: VendorRecord): Promise<string>;
};

const SUPABASE_MEDIA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim() || "project-media";

function sanitizeFolderName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sanitizeFilename(value: string) {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return cleaned.length > 0 ? cleaned : "upload.bin";
}

function inferMimeType(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    default:
      return "application/octet-stream";
  }
}

class DemoSupabaseStorageService implements MediaStorageService {
  readonly provider: MediaStorageProvider = "supabase";

  async resolveProjectFolder(project: ProjectRecord, vendor: VendorRecord) {
    const projectSegment = sanitizeFolderName(project.name);
    const vendorSegment = sanitizeFolderName(vendor.name);
    return `projects/${projectSegment}/${vendorSegment}`;
  }

  async uploadMedia(files: MediaUploadInput[], context: MediaUploadContext) {
    const folderPath = await this.resolveProjectFolder(context.project, context.vendor);

    return files.map((file) => {
      const externalFileId = crypto.randomUUID();
      const storedFilename = `${externalFileId}-${sanitizeFilename(file.filename)}`;
      const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const externalUrl = publicBase
        ? `${publicBase}/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/${folderPath}/${storedFilename}`
        : `supabase://${SUPABASE_MEDIA_BUCKET}/${folderPath}/${storedFilename}`;

      return {
        id: crypto.randomUUID(),
        name: file.filename,
        caption: file.caption,
        storageProvider: this.provider,
        externalFileId,
        externalFolderId: `${SUPABASE_MEDIA_BUCKET}/${folderPath}`,
        externalUrl,
        mimeType: file.mimeType || inferMimeType(file.filename),
        sizeBytes: file.sizeBytes ?? 0,
        uploadedByUserId: context.actor.id,
        uploadedAt: new Date().toISOString()
      };
    });
  }

  async deleteMedia(_media: UpdateMediaRecord, _context: MediaAccessContext) {
    return true;
  }

  async getMediaAccessUrl(media: UpdateMediaRecord, _context: MediaAccessContext) {
    return media.externalUrl;
  }
}

const storageService = new DemoSupabaseStorageService();

export async function uploadMedia(files: MediaUploadInput[], context: MediaUploadContext) {
  return storageService.uploadMedia(files, context);
}

export async function deleteMedia(media: UpdateMediaRecord, context: MediaAccessContext) {
  return storageService.deleteMedia(media, context);
}

export async function getMediaAccessUrl(media: UpdateMediaRecord, context: MediaAccessContext) {
  return storageService.getMediaAccessUrl(media, context);
}

export async function resolveProjectFolder(project: ProjectRecord, vendor: VendorRecord) {
  return storageService.resolveProjectFolder(project, vendor);
}
