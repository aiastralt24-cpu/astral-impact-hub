import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-xl",
  {
    variants: {
      variant: {
        pending: "border-amber-500/20 bg-amber-500/8 text-amber-700",
        review: "border-[var(--primary)]/18 bg-[var(--primary)]/8 text-[var(--primary)]",
        revision: "border-orange-500/18 bg-orange-500/8 text-orange-700",
        approved: "border-emerald-500/18 bg-emerald-500/8 text-emerald-700",
        rejected: "border-rose-500/18 bg-rose-500/8 text-rose-700",
        published: "border-[var(--primary)]/28 bg-[var(--primary)] text-white",
        neutral: "border-[var(--border)] bg-white/84 text-[var(--foreground)]"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
