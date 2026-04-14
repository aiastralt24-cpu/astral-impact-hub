import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const params = (await searchParams) ?? {};
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="section-shell glass-panel grid w-full max-w-6xl overflow-hidden rounded-[40px] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden min-h-[680px] bg-[linear-gradient(160deg,#eef4ff_0%,#dce8ff_42%,#cfdfff_100%)] lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,89,255,0.14),transparent_0,transparent_34%),radial-gradient(circle_at_75%_72%,rgba(0,71,171,0.12),transparent_0,transparent_30%)]" />
          <div className="relative flex h-full w-full items-center justify-center p-12">
            <Image
              src="/brand/astral-foundation-logo.jpg"
              alt="Astral Foundation logo"
              width={960}
              height={960}
              priority
              className="h-auto w-full max-w-[520px] rounded-[28px] shadow-[0_32px_80px_rgba(0,71,171,0.18)] object-contain"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        </div>
        <section className="flex min-h-[680px] items-center bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(252,253,255,0.92))] px-8 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--gray-mid)]">Sign in</p>
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
              Astral Impact Hub
            </h1>
            <form action={loginAction} className="mt-10 space-y-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--gray-mid)]">User ID</span>
                  <input
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your user ID"
                    className="h-14 w-full rounded-[22px] border-[rgba(0,71,171,0.10)] bg-white/88 px-5 text-lg font-medium shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--gray-mid)]">Password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-[22px] border-[rgba(0,71,171,0.10)] bg-white/88 px-5 text-lg font-medium shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
                  />
                </label>
              </div>
              {params.error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Invalid user ID or password.
                </p>
              ) : null}
              <Button className="h-14 w-full bg-[linear-gradient(135deg,#0047ab,#0059ff)] text-lg shadow-[0_16px_34px_rgba(0,71,171,0.22)] hover:brightness-[1.03]">
                Continue
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
