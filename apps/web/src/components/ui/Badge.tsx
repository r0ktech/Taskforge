import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full text-[11px] font-medium px-2 py-0.5 leading-4", {
  variants: {
    variant: {
      neutral: "bg-surface-raised text-ink-muted border border-border",
      accent: "bg-accent-muted text-accent",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      danger: "bg-danger/10 text-danger",
      solid: "bg-ink text-canvas",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
