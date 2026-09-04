export const PRIORITY_META = {
  LOW: { label: "Low", variant: "neutral" as const, dot: "#94A3B8" },
  MEDIUM: { label: "Medium", variant: "accent" as const, dot: "#6366F1" },
  HIGH: { label: "High", variant: "warning" as const, dot: "#F59E0B" },
  URGENT: { label: "Urgent", variant: "danger" as const, dot: "#EF4444" },
} as const;
