"use client";

import { startTransition, useMemo, useState } from "react";
import { ClipboardList, FileImage, Flag, MessagesSquare, Sparkles, Target, Telescope } from "lucide-react";

import { createUpdateAction } from "@/features/updates/actions";
import { cn } from "@/lib/utils";
import type { ProjectRecord, VendorRecord } from "@/types/domain";

const steps = [
  { label: "Project", title: "Choose the project", description: "Start with the right project and vendor context.", icon: Telescope },
  { label: "What happened", title: "Describe the work", description: "Capture the field activity in plain language.", icon: ClipboardList },
  { label: "Impact data", title: "Add the numbers", description: "Record progress and the people or outcomes reached.", icon: Target },
  { label: "Story layer", title: "Shape the story", description: "Add the human details that make the update usable later.", icon: MessagesSquare },
  { label: "Media", title: "Attach the proof", description: "Upload the visuals that support the update.", icon: FileImage },
  { label: "Flags", title: "Mark the context", description: "Call out urgency, sensitivity, or publishing value.", icon: Flag },
  { label: "Review", title: "Check before submit", description: "Review the summary and send it onward.", icon: Sparkles }
] as const;

type UpdateWizardProps = {
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  defaultVendorId?: string;
};

type StoryField = {
  label: string;
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
};

type FlagField = {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
};

type MediaSelection = {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
};

export function UpdateWizard({ projects, vendors, defaultVendorId }: UpdateWizardProps) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [beneficiariesCount, setBeneficiariesCount] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("People");
  const [progressPercent, setProgressPercent] = useState(50);
  const [workDuration, setWorkDuration] = useState("full_day");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [highlightMoment, setHighlightMoment] = useState("");
  const [quote, setQuote] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaSelection[]>([]);
  const [socialMediaWorthy, setSocialMediaWorthy] = useState(true);
  const [urgent, setUrgent] = useState(false);
  const [documentationOnly, setDocumentationOnly] = useState(false);
  const [sensitiveContent, setSensitiveContent] = useState(false);

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);
  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === (defaultVendorId || selectedProject?.vendorIds[0] || vendors[0]?.id)),
    [defaultVendorId, selectedProject, vendors]
  );

  const stepConfig = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const canAdvance = step === 0 ? Boolean(projectId) : step === 1 ? description.trim().length > 20 : true;

  const storyFields: StoryField[] = [
    { label: "Why does today matter?", placeholder: "What changed because of this work?", value: whyItMatters, setValue: setWhyItMatters },
    { label: "Highlight moment", placeholder: "Name one person, moment, or detail worth carrying forward.", value: highlightMoment, setValue: setHighlightMoment },
    { label: "Direct quote", placeholder: "Add one line someone actually said.", value: quote, setValue: setQuote },
    { label: "Challenges", placeholder: "Mention anything that slowed or blocked progress.", value: challenges, setValue: setChallenges },
    { label: "Next steps", placeholder: "What needs to happen next?", value: nextSteps, setValue: setNextSteps }
  ];

  const flagFields: FlagField[] = [
    { label: "Social-media worthy", checked: socialMediaWorthy, setChecked: setSocialMediaWorthy },
    { label: "Urgent / time-sensitive", checked: urgent, setChecked: setUrgent },
    { label: "Documentation only", checked: documentationOnly, setChecked: setDocumentationOnly },
    { label: "Sensitive content", checked: sensitiveContent, setChecked: setSensitiveContent }
  ];

  const reviewItems = [
    { label: "Project", value: selectedProject?.name ?? "No project selected" },
    { label: "Vendor", value: selectedVendor?.name ?? "No vendor selected" },
    { label: "Progress", value: `${progressPercent}% complete` },
    { label: "Media", value: `${mediaFiles.length} file${mediaFiles.length === 1 ? "" : "s"}` },
    { label: "Beneficiaries", value: beneficiariesCount ? `${beneficiariesCount} ${beneficiaryType}` : "Not added yet" },
    { label: "Readiness", value: socialMediaWorthy ? "Strong publishing potential" : "Documentation first" }
  ];

  const projectSummary = [
    { label: "Vendor", value: selectedVendor?.name ?? "Assigned automatically" },
    { label: "Location", value: selectedProject?.location ?? "Will be added from project record" },
    { label: "Reporting", value: selectedProject?.reportingFrequency ?? "Not set" }
  ];

  const reviewSections = [
    {
      title: "Field summary",
      value: description || "No field summary added yet."
    },
    {
      title: "Impact snapshot",
      value: beneficiariesCount ? `${beneficiariesCount} ${beneficiaryType}, ${progressPercent}% progress` : `${progressPercent}% progress, beneficiaries not added yet`
    },
    {
      title: "Story layer",
      value: [whyItMatters, highlightMoment, quote].filter(Boolean).join(" • ") || "No story details added yet."
    },
    {
      title: "Flags and media",
      value:
        `${mediaFiles.length} media file${mediaFiles.length === 1 ? "" : "s"} • ${flagFields
          .filter((field) => field.checked)
          .map((field) => field.label)
          .join(", ") || "No special flags selected"}`
    }
  ];

  return (
    <div className="glass-card overflow-hidden rounded-[32px]">
      <div className="border-b border-[var(--border)] px-6 py-5 sm:px-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] xl:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--primary-light)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                Step {step + 1} of {steps.length}
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">{progress}% complete</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-blue)]">Submission workspace</p>
              <h2 className="mt-2 font-display text-[24px] font-black tracking-[-0.04em] text-[var(--foreground)] sm:text-[30px]">{stepConfig.title}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--gray-mid)]">{stepConfig.description}</p>
            </div>
          </div>

          <div className="space-y-4 xl:pt-1">
            <div className="h-2 rounded-full bg-[#e9edf5]">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),#89a8ff)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = index === step;
                const complete = index < step;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setStep(index)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                      active
                        ? "border-[var(--primary)]/24 bg-[var(--primary-light)] text-[var(--primary)]"
                        : complete
                          ? "border-[var(--border)] bg-white text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[#f8f9fc] text-[var(--gray-mid)] hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.4fr)_350px]">
        <div className="px-6 py-6 sm:px-7">
          {step === 0 ? (
            <div className="space-y-5">
              <label className="block max-w-xl">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Project</span>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-12 w-full rounded-2xl px-4">
                  {projects.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                {projectSummary.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--gray-mid)]">{item.label}</p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                <p className="text-sm font-medium text-[var(--foreground)]">What happens next</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">
                  Once you continue, the selected project, vendor, and project rules carry through the rest of the submission.
                </p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">What happened today</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={300}
                className="min-h-[220px] w-full rounded-[24px] px-4 py-4"
                placeholder="Describe the work completed, the site activity, and what changed today."
              />
              <span className="mt-2 block text-xs text-[var(--gray-mid)]">{description.length}/300</span>
            </label>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Beneficiaries count</span>
                <input value={beneficiariesCount} onChange={(event) => setBeneficiariesCount(event.target.value)} type="number" className="h-12 w-full rounded-2xl px-4" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Beneficiary type</span>
                <select value={beneficiaryType} onChange={(event) => setBeneficiaryType(event.target.value)} className="h-12 w-full rounded-2xl px-4">
                  <option>People</option>
                  <option>Animals</option>
                  <option>Hectares of land</option>
                  <option>Litres of water</option>
                  <option>Other</option>
                </select>
              </label>
              <div className="rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4 md:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-[var(--foreground)]">Progress</span>
                  <span className="text-sm text-[var(--gray-mid)]">{progressPercent}%</span>
                </div>
                <input value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} type="range" min={0} max={100} className="mt-4 w-full" />
              </div>
              <label className="block md:max-w-[280px]">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Work duration</span>
                <select value={workDuration} onChange={(event) => setWorkDuration(event.target.value)} className="h-12 w-full rounded-2xl px-4">
                  <option value="half_day">Half day</option>
                  <option value="full_day">Full day</option>
                  <option value="multiple_days">Multiple days</option>
                </select>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              {storyFields.map((field) => (
                <label className="block" key={field.label}>
                  <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">{field.label}</span>
                  <textarea
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-[96px] w-full rounded-[24px] px-4 py-3"
                  />
                </label>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Media files</span>
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    setMediaFiles(
                      Array.from(event.target.files ?? []).map((file) => ({
                        name: file.name,
                        mimeType: file.type,
                        sizeBytes: file.size
                      }))
                    )
                  }
                  className="block w-full text-sm"
                />
              </label>
              <div className="rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                <p className="text-sm text-[var(--gray-mid)]">Media metadata is saved into the app, while heavy files are routed through the external media layer.</p>
              </div>
              {mediaFiles.length ? (
                <div className="flex flex-wrap gap-2">
                  {mediaFiles.map((file) => (
                    <span key={file.name} className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--foreground)]">
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {flagFields.map((field) => (
                <label key={field.label} className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4 text-[var(--foreground)]">
                  <input type="checkbox" checked={field.checked} onChange={(event) => field.setChecked(event.target.checked)} />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-5">
              <div className="rounded-[28px] border border-[var(--border)] bg-[#f8f9fc] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-display text-[30px] font-black leading-[1.02] tracking-[-0.05em] text-[var(--foreground)]">
                      {selectedProject?.name}
                    </p>
                    <p className="text-sm text-[var(--gray-mid)]">{selectedVendor?.name ?? "No vendor assigned"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewItems.slice(2).map((item) => (
                      <span key={item.label} className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--foreground)]">
                        {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {reviewSections.map((section) => (
                  <div key={section.title} className="rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">{section.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{section.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {reviewItems.slice(0, 3).map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[var(--border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--gray-mid)]">{item.label}</p>
                    <p className="mt-2 text-base font-semibold leading-7 text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="border-t border-[var(--border)] bg-[#f8f9fc] px-6 py-6 xl:border-l xl:border-t-0">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Current context</p>
              <div className="mt-3 rounded-[24px] border border-[var(--border)] bg-white p-4">
                <p className="font-medium text-[var(--foreground)]">{selectedProject?.name ?? "No project selected"}</p>
                <p className="mt-1 text-sm text-[var(--gray-mid)]">{selectedVendor?.name ?? "Vendor will be assigned automatically"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Step focus</p>
              <div className="mt-3 rounded-[24px] border border-[var(--border)] bg-white p-4">
                <p className="text-sm leading-6 text-[var(--gray-mid)]">{stepConfig.description}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Submission status</p>
              <div className="mt-3 rounded-[24px] border border-[var(--border)] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--gray-mid)]">Form progress</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{progress}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#edf1f7]">
                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,#5d63ff,#95a2ff)]" style={{ width: `${progress}%` }} />
                </div>
                {status ? <p className="mt-4 text-sm text-[var(--gray-mid)]">{status}</p> : null}
              </div>
            </div>

            {step < 6 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Before you continue</p>
                <div className="mt-3 rounded-[24px] border border-[var(--border)] bg-white p-4">
                  <p className="text-sm leading-6 text-[var(--gray-mid)]">
                    Keep each step concise. The approval team should be able to understand the work, evidence, and story without guessing.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] bg-white/82 px-6 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm text-[var(--gray-mid)] transition-colors hover:bg-[#f7f8fc] hover:text-[var(--foreground)]"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
              className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(0,89,255,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!selectedProject || !selectedVendor) return;
                setStatus("Submitting update...");
                startTransition(async () => {
                  await createUpdateAction({
                    projectId: selectedProject.id,
                    projectName: selectedProject.name,
                    vendorId: selectedVendor.id,
                    vendorName: selectedVendor.name,
                    happenedAt: new Date().toISOString().slice(0, 10),
                    description,
                    beneficiariesCount: beneficiariesCount ? Number(beneficiariesCount) : undefined,
                    beneficiaryType,
                    progressPercent,
                    workDuration,
                    whyItMatters,
                    highlightMoment,
                    quote,
                    challenges,
                    nextSteps,
                    socialMediaWorthy,
                    urgent,
                    documentationOnly,
                    sensitiveContent,
                    mediaFiles
                  });
                  setStatus("Update submitted.");
                  setStep(0);
                  setDescription("");
                  setMediaFiles([]);
                });
              }}
              className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(0,89,255,0.22)] transition-colors hover:brightness-105"
            >
              Submit update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
