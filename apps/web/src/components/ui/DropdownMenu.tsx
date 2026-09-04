"use client";
import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: DropdownPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-md border border-border bg-surface-raised p-1 shadow-panel animate-slide-up",
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: DropdownPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors",
        "focus:bg-accent-muted focus:text-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: DropdownPrimitive.DropdownMenuSeparatorProps) {
  return <DropdownPrimitive.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: DropdownPrimitive.DropdownMenuLabelProps) {
  return <DropdownPrimitive.Label className={cn("px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint", className)} {...props} />;
}
