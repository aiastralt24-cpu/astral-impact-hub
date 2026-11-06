"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, ChevronDown, LoaderCircle, Save, Send, X } from "lucide-react";

import { createUpdateAction, prepareMediaUploadsAction } from "@/features/updates/actions";
import { resolveAssignedProjectId } from "@/lib/domain/project-selection";
import { getUpdateErrorMessage, validateBeneficiaryCount } from "@/lib/domain/update-validation";
import { MAX_MEDIA_FILES_PER_UPDATE, MAX_MEDIA_FILE_BYTES, formatMediaLimit } from "@/lib/media/limits";
import { createClient } from "@/lib/supabase/client";
import type { ProjectRecord, UpdateMediaRecord, VendorRecord } from "@/types/domain";

type UpdateWizardProps = {
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  defaultVendorId?: string;
  initialProjectId?: string;
};

const DRAFT_KEY = "foundation-hub:update-draft:v2";

type SubmissionStatus = {
  tone: "info" | "error" | "success";
  message: string;
};

export function UpdateWizard({ projects, vendors, defaultVendorId, initialProjectId }: UpdateWizardProps) {
  const [projectId, setProjectId] = useState(() => resolveAssignedProjectId(projects, initialProjectId));
  const [description, setDescription] = useState("");
  const [progressPercent, setProgressPercent] = useState(50);
  const [reachCount, setReachCount] = useState("");
  const [reachType, setReachType] = useState("People");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [whyItMatters, setWhyItMatters] = useState("");
  const [highlightMoment, setHighlightMoment] = useState("");
  const [quote, setQuote] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);
  const selectedVendor = useMemo(() => {
    const assignedIds = selectedProject?.vendorIds ?? [];
    const preferredId = defaultVendorId && assignedIds.includes(defaultVendorId) ? defaultVendorId : assignedIds[0];
    return vendors.find((vendor) => vendor.id === preferredId);
  }, [defaultVendorId, selectedProject, vendors]);

  function draftPayload() {
    return {
      projectId,
      description,
      progressPercent,
      reachCount,
      reachType,
      whyItMatters,
      highlightMoment,
      quote,
      challenges,
      nextSteps,
      sensitiveContent,
      savedAt: new Date().toISOString()
    };
  }

  function saveDraft(showMessage = true) {
    if (!description.trim() && !reachCount && mediaFiles.length === 0) {
      if (showMessage) setStatus({ tone: "error", message: "Add a description, outcome, or media file before saving." });
      return;
    }
    const draft = draftPayload();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setLastSavedAt(draft.savedAt);
    if (showMessage) setStatus({ tone: "success", message: "Draft saved on this device." });
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as Record<string, unknown>;
        setProjectId(resolveAssignedProjectId(projects, initialProjectId, typeof draft.projectId === "string" ? draft.projectId : undefined));
        setDescription(String(draft.description ?? ""));
        setProgressPercent(Number(draft.progressPercent ?? 50));
        setReachCount(String(draft.reachCount ?? ""));
        setReachType(String(draft.reachType ?? "People"));
        setWhyItMatters(String(draft.whyItMatters ?? ""));
        setHighlightMoment(String(draft.highlightMoment ?? ""));
        setQuote(String(draft.quote ?? ""));
        setChallenges(String(draft.challenges ?? ""));
        setNextSteps(String(draft.nextSteps ?? ""));
        setSensitiveContent(Boolean(draft.sensitiveContent));
        setLastSavedAt(typeof draft.savedAt === "string" ? draft.savedAt : null);
        setStatus({ tone: "info", message: "Your saved draft has been restored." });
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, [initialProjectId, projects]);

  useEffect(() => {
    setProjectId((current) => resolveAssignedProjectId(projects, current, initialProjectId));
  }, [initialProjectId, projects]);

  useEffect(() => {
    if (!draftReady || (!description.trim() && !reachCount)) return;
    const timer = window.setTimeout(() => saveDraft(false), 700);
    return () => window.clearTimeout(timer);
  }, [draftReady, projectId, description, progressPercent, reachCount, reachType, whyItMatters, highlightMoment, quote, challenges, nextSteps, sensitiveContent]);

  function resetForm() {
    window.localStorage.removeItem(DRAFT_KEY);
    setDescription("");
    setProgressPercent(50);
    setReachCount("");
    setReachType("People");
    setMediaFiles([]);
    setWhyItMatters("");
    setHighlightMoment("");
    setQuote("");
    setChallenges("");
    setNextSteps("");
    setSensitiveContent(false);
    setLastSavedAt(null);
  }

  function submitUpdate() {
    if (!selectedProject) {
      setStatus({ tone: "error", message: "Select a project before submitting the update." });
      return;
    }
    if (!description.trim()) {
      setStatus({ tone: "error", message: "Describe what happened before submitting the update." });
      return;
    }
    const beneficiaryCountError = validateBeneficiaryCount(reachCount);
    if (beneficiaryCountError) {
      setStatus({ tone: "error", message: beneficiaryCountError });
      return;
    }
    const oversizedFile = mediaFiles.find((file) => file.size > MAX_MEDIA_FILE_BYTES);
    if (oversizedFile) {
      setStatus({ tone: "error", message: `${oversizedFile.name} is larger than the ${formatMediaLimit(MAX_MEDIA_FILE_BYTES)} per-file limit.` });
      return;
    }
    if (mediaFiles.length > MAX_MEDIA_FILES_PER_UPDATE) {
      setStatus({ tone: "error", message: `Select no more than ${MAX_MEDIA_FILES_PER_UPDATE} files per update.` });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: "info", message: "Starting submission..." });
    startTransition(async () => {
      try {
        let uploadedMedia: UpdateMediaRecord[] = [];
        if (mediaFiles.length > 0) {
          setStatus({ tone: "info", message: `Preparing ${mediaFiles.length} media ${mediaFiles.length === 1 ? "file" : "files"}...` });
          const prepared = await prepareMediaUploadsAction(
            selectedProject.id,
            selectedVendor?.id ?? "",
            mediaFiles.map((file) => ({ filename: file.name, mimeType: file.type, sizeBytes: file.size }))
          );
          if (!prepared.ok) {
            setStatus({ tone: "error", message: prepared.message });
            return;
          }

          const supabase = createClient();
          const parallelUploads = 3;
          for (let start = 0; start < prepared.uploads.length; start += parallelUploads) {
            const batch = prepared.uploads.slice(start, start + parallelUploads);
            const end = Math.min(start + batch.length, prepared.uploads.length);
            setStatus({ tone: "info", message: `Uploading files ${start + 1}–${end} of ${prepared.uploads.length}...` });
            await Promise.all(batch.map(async (upload, batchIndex) => {
              const file = mediaFiles[start + batchIndex];
              const { error } = await supabase.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET || "project-media")
                .uploadToSignedUrl(upload.path, upload.token, file, {
                  contentType: file.type || upload.media.mimeType,
                  upsert: false
                });
              if (error) throw new Error(`Could not upload ${upload.media.name}: ${error.message}`);
            }));
          }
          uploadedMedia = prepared.uploads.map((upload) => upload.media);
        }

        setStatus({ tone: "info", message: "Files uploaded. Saving the update..." });
        const formData = new FormData();
        const fields = {
        projectId: selectedProject.id,
        vendorId: selectedVendor?.id ?? "",
        happenedAt: new Date().toISOString().slice(0, 10),
        description,
        beneficiariesCount: reachCount,
        beneficiaryType: reachType,
        progressPercent: String(progressPercent),
        workDuration: "full_day",
        whyItMatters,
        highlightMoment,
        quote,
        challenges,
        nextSteps,
        socialMediaWorthy: "false",
        urgent: "false",
        documentationOnly: "false",
        sensitiveContent: String(sensitiveContent)
      };
        Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
        formData.set("uploadedMedia", JSON.stringify(uploadedMedia));
        const result = await createUpdateAction(formData);
        setStatus({ tone: result.ok ? "success" : "error", message: result.message });
        if (result.ok) resetForm();
      } catch (error) {
        console.error("Update submission request failed", error);
        setStatus({ tone: "error", message: getUpdateErrorMessage(error) });
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Quick update</h2>
        <p className="mt-1 text-sm text-[var(--gray-mid)]">Add the essential details. Everything else is optional.</p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Project</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-12 w-full rounded-xl px-4">
            {projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
          </select>
          <span className="mt-2 block text-xs text-[var(--gray-mid)]">
            {selectedVendor ? `CSR Associate: ${selectedVendor.name}` : "Managed internally by the Astral Foundation team"}
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">What happened?</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            className="min-h-32 w-full rounded-xl px-4 py-3"
            placeholder="Example: The team repaired two water points and cleared the surrounding area."
          />
          <span className="mt-1 block text-right text-xs text-[var(--gray-mid)]">{description.length}/300</span>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--foreground)]">Progress</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Started", value: 10 },
              { label: "In progress", value: 50 },
              { label: "Completed", value: 100 }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setProgressPercent(option.value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium ${progressPercent === option.value ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-[var(--border)] bg-white text-[var(--gray-mid)]"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">People or outcomes reached</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <input value={reachCount} onChange={(event) => setReachCount(event.target.value)} type="number" min="0" step="1" inputMode="numeric" placeholder="Whole number" className="h-12 rounded-xl px-4" />
            <select value={reachType} onChange={(event) => setReachType(event.target.value)} className="h-12 rounded-xl px-4">
              <option>People</option><option>Animals</option><option>Hectares of land</option><option>Litres of water</option><option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">Photos or videos</p>
          <p className="mb-3 text-xs text-[var(--gray-mid)]">Up to {MAX_MEDIA_FILES_PER_UPDATE} files, {formatMediaLimit(MAX_MEDIA_FILE_BYTES)} per file.</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(0,89,255,0.28)] bg-blue-50/50 px-4 py-5 text-sm font-semibold text-[var(--primary)]">
            <Camera className="h-5 w-5" /> Add photos or videos
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const additions = Array.from(event.target.files ?? []);
                const unsupported = additions.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
                const oversized = additions.find((file) => file.size > MAX_MEDIA_FILE_BYTES);
                if (unsupported) {
                  setStatus({ tone: "error", message: `${unsupported.name} is not a supported image or video.` });
                } else if (oversized) {
                  setStatus({ tone: "error", message: `${oversized.name} is larger than the ${formatMediaLimit(MAX_MEDIA_FILE_BYTES)} per-file limit.` });
                } else {
                  const uniqueAdditions = additions.filter((file) => !mediaFiles.some((item) => item.name === file.name && item.size === file.size));
                  if (mediaFiles.length + uniqueAdditions.length > MAX_MEDIA_FILES_PER_UPDATE) {
                    setStatus({ tone: "error", message: `You can attach up to ${MAX_MEDIA_FILES_PER_UPDATE} files per update.` });
                  } else {
                    setMediaFiles((current) => [...current, ...uniqueAdditions]);
                    setStatus(null);
                  }
                }
                event.target.value = "";
              }}
            />
          </label>
          {mediaFiles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaFiles.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}`} className="inline-flex items-center gap-2 rounded-full bg-[#f4f6fa] px-3 py-2 text-xs text-[var(--foreground)]">
                  {file.name} · {formatMediaLimit(file.size)}
                  <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <details className="rounded-xl border border-[var(--border)] bg-[#f8f9fc]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
            Add more details <ChevronDown className="h-4 w-4 text-[var(--gray-mid)]" />
          </summary>
          <div className="grid gap-4 border-t border-[var(--border)] p-4">
            {[
              ["Why this matters", whyItMatters, setWhyItMatters],
              ["Key moment", highlightMoment, setHighlightMoment],
              ["Direct quote", quote, setQuote],
              ["Challenges", challenges, setChallenges],
              ["Next steps", nextSteps, setNextSteps]
            ].map(([label, value, setter]) => (
              <label key={label as string} className="block">
                <span className="mb-2 block text-sm text-[var(--foreground)]">{label as string}</span>
                <textarea value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="min-h-20 w-full rounded-xl px-4 py-3" />
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input type="checkbox" checked={sensitiveContent} onChange={(event) => setSensitiveContent(event.target.checked)} />
              Contains sensitive information
            </label>
          </div>
        </details>

        {status ? (
          <div
            role={status.tone === "error" ? "alert" : "status"}
            aria-live={status.tone === "error" ? "assertive" : "polite"}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              status.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : status.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {status.tone === "error" ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : status.tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <LoaderCircle className={`mt-0.5 h-5 w-5 shrink-0 ${isSubmitting ? "animate-spin" : ""}`} />}
            <div><p className="font-semibold">{status.tone === "error" ? "Action needed" : status.tone === "success" ? "Done" : "Status"}</p><p className="mt-0.5">{status.message}</p></div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => saveDraft(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]">
            <Save className="h-4 w-4" /> Save for later
          </button>
          <button type="button" disabled={isSubmitting} onClick={submitUpdate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            <Send className="h-4 w-4" /> {isSubmitting ? "Submitting..." : "Submit update"}
          </button>
        </div>
        {lastSavedAt ? <p className="text-right text-xs text-[var(--gray-mid)]">Saved at {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p> : null}
      </div>
    </section>
  );
}
