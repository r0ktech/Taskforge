"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: DialogPrimitive.DialogContentProps & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-panel animate-slide-up focus:outline-none sm:w-full sm:p-6",
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="tf-focus-ring absolute right-4 top-4 rounded-md p-1 text-ink-faint hover:bg-surface-raised hover:text-ink">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn("text-base font-display font-semibold text-ink", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn("mt-1 text-sm text-ink-muted", className)} {...props} />;
}
