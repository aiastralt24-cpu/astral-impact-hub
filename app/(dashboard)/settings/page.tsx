import { isDemoMode } from "@/lib/env";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Runtime mode</p>
          <p className="font-display mt-4 text-2xl font-black">{isDemoMode ? "Demo mode" : "Connected mode"}</p>
          <p className="mt-3 text-sm text-[var(--gray-mid)]">
            Demo mode uses a server-side store and cookie sessions. Connected mode will use Supabase once environment variables are present.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Next integrations</p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--gray-mid)]">
            <li>Supabase auth and storage hookup</li>
            <li>Anthropic live prompt controls</li>
            <li>Telegram, WhatsApp, and Instagram credentials</li>
            <li>Resend transactional mail wiring</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
