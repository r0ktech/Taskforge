"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!bg-surface-raised !border !border-border !text-ink !shadow-panel !rounded-lg",
          title: "!text-ink !text-[13px] !font-medium",
          description: "!text-ink-muted !text-[12px]",
          actionButton: "!bg-accent !text-white",
        },
      }}
    />
  );
}
