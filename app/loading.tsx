import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6"
      style={{ backgroundColor: "#f6f7f9", color: "#121a27" }}
      aria-busy="true"
    >
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle
          aria-hidden="true"
          className="h-7 w-7 animate-spin text-[var(--primary)] motion-reduce:animate-none"
        />
        <p className="text-sm font-medium">Loading your workspace…</p>
      </div>
    </main>
  );
}
