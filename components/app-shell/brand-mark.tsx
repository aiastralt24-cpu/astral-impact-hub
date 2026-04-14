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
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-[20px] border border-white/20 shadow-[0_10px_24px_rgba(0,0,0,0.08)]",
          compact ? "h-12 w-12" : "h-14 w-14",
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
          <p className={cn("font-display text-[1.15rem] font-black leading-none tracking-[-0.02em]", dark ? "text-[var(--foreground)]" : "text-[var(--primary)]")}>
            Astral Foundation
          </p>
          <p className={cn("mt-1 text-sm leading-none", dark ? "text-[var(--gray-mid)]" : "text-[var(--gray-mid)]")}>Impact Hub</p>
        </div>
      )}
    </Link>
  );
}
