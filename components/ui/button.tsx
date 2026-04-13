import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,rgba(93,99,255,1),rgba(114,126,255,1))] px-4 py-2 text-white shadow-[0_12px_24px_rgba(93,99,255,0.22)] hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "bg-white px-4 py-2 text-[var(--foreground)] ring-1 ring-[var(--border)] backdrop-blur-xl hover:bg-[#f7f8fc]",
        ghost: "px-3 py-2 text-[var(--foreground)] hover:bg-black/4"
      },
      size: {
        sm: "h-9",
        md: "h-11",
        lg: "h-12 px-5"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
