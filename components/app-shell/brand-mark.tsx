import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  dark?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, dark = false, className }: BrandMarkProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-4", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-white/20 shadow-lg",
          compact ? "h-12 w-12" : "h-16 w-16",
          dark ? "border-white/15" : "border-[var(--border)]"
        )}
      >
        <Image
          src="/brand/astral-foundation-logo.jpg"
          alt="Astral Foundation logo"
          width={160}
          height={160}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {compact ? null : (
        <div className="min-w-0">
          <p className={cn("font-display text-xl font-black tracking-[0.02em]", dark ? "text-[var(--foreground)]" : "text-[var(--primary)]")}>
            Astral Foundation
          </p>
          <p className={cn("text-sm", dark ? "text-[var(--gray-mid)]" : "text-[var(--gray-mid)]")}>Impact Hub</p>
        </div>
      )}
    </Link>
  );
}
