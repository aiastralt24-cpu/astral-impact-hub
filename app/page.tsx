import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

import { BrandMark } from "@/components/app-shell/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/lib/env";

const pillars = [
  {
    icon: UploadCloud,
    title: "Capture field activity in minutes",
    body: "Mobile-first submission flows built for low-connectivity vendors and structured progress reporting."
  },
  {
    icon: ShieldCheck,
    title: "Validate with a disciplined approval chain",
    body: "Review queues, inline revision feedback, SLAs, and role-aware governance keep the data clean."
  },
  {
    icon: Sparkles,
    title: "Generate stories and distribute them fast",
    body: "AI-assisted captioning, scripts, digests, and channel workflows turn updates into publishable content."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <section className="section-shell glass-panel mx-auto max-w-7xl overflow-hidden rounded-[40px] px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(109,116,255,0.14),transparent_0,transparent_28%),radial-gradient(circle_at_78%_26%,rgba(170,184,255,0.12),transparent_0,transparent_24%),linear-gradient(145deg,rgba(248,250,253,0.96),rgba(238,242,248,0.92))]" />
        <div className="absolute inset-0 soft-grid opacity-[0.14]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <BrandMark dark className="w-fit" />
            <p className="mt-6 inline-flex rounded-full bg-white/86 px-4 py-2 text-sm text-[var(--gray-mid)] ring-1 ring-[var(--border)] backdrop-blur-2xl">
              {isDemoMode ? "Demo mode" : "Connected mode"}
            </p>
            <h1 className="font-display mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[var(--foreground)] sm:text-7xl">
              A calmer workspace for real operations.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--gray-mid)] sm:text-lg">
              Capture updates, review progress, and publish stories from one clean product surface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Choose a role</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-[var(--gray-mid)]">
              {["Capture", "Approve", "Publish"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 ring-1 ring-[var(--border)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent-blue)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-card mx-auto max-w-xl rounded-[36px] p-4">
              <div className="rounded-[30px] border border-[var(--border)] bg-white/84 p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Astral Blue Interface</p>
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--foreground)]/26" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--foreground)]/16" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--foreground)]/10" />
                  </div>
                </div>
                <div className="mt-5 overflow-hidden rounded-[26px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(93,99,255,0.92),rgba(128,138,255,0.85))] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/72">Portfolio health</p>
                      <p className="font-display mt-2 text-5xl font-black tracking-[-0.06em]">84</p>
                    </div>
                    <div className="rounded-full bg-white/18 px-4 py-2 text-sm text-white ring-1 ring-white/12">
                      Live
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white/16 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/62">Pending</p>
                      <p className="font-display mt-2 text-3xl font-black">14</p>
                    </div>
                    <div className="rounded-3xl bg-white/16 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/62">Ready</p>
                      <p className="font-display mt-2 text-3xl font-black">96</p>
                    </div>
                    <div className="rounded-3xl bg-white/16 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/62">Delivered</p>
                      <p className="font-display mt-2 text-3xl font-black">98%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Product pillars</p>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
              Built for teams in the middle of the work.
            </h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="section-shell bg-transparent">
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-[var(--accent-blue)] ring-1 ring-[var(--border)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-5 text-2xl">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--gray-mid)]">{pillar.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
