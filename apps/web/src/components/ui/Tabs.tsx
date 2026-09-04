"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("inline-flex items-center gap-1 rounded-md bg-surface-raised p-1 border border-border", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "tf-focus-ring rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors",
        "data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-subtle",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("focus:outline-none", className)} {...props} />;
}
