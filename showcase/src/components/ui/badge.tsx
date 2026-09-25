import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        secondary: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        success: "border-transparent bg-[var(--badge-success-bg)] text-[var(--feedback-success-text)]",
        warning: "border-transparent bg-[var(--badge-warning-bg)] text-[var(--feedback-warning-text)]",
        danger: "border-transparent bg-[var(--badge-danger-bg)] text-[var(--feedback-danger-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
