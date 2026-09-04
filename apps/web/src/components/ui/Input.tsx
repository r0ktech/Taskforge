import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "tf-focus-ring flex h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors",
        "hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "tf-focus-ring flex w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors resize-none",
        "hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium text-ink-muted", className)} {...props} />;
}
