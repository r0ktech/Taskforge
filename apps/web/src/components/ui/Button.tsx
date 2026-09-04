import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "tf-focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white shadow-subtle hover:bg-accent-hover active:brightness-95",
        secondary:
          "bg-surface border border-border-strong text-ink shadow-subtle hover:bg-surface-raised hover:border-ink-faint",
        ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
        danger: "bg-danger text-white hover:brightness-95",
        outline: "border border-border text-ink hover:bg-surface-raised",
      },
      size: {
        sm: "h-8 px-2.5 text-[13px]",
        md: "h-9 px-3.5",
        lg: "h-10 px-5 text-[15px]",
        icon: "h-9 w-9 shrink-0 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
