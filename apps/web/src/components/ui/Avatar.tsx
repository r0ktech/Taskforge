import * as React from "react";
import { cn } from "@/lib/cn";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const sizes = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({
  name,
  color = "#6366F1",
  src,
  size = "md",
  className,
  ring,
}: {
  name: string;
  color?: string | null;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover shrink-0",
          sizes[size],
          ring && "ring-2 ring-surface",
          className
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        sizes[size],
        ring && "ring-2 ring-surface",
        className
      )}
      style={{ backgroundColor: color ?? "#6366F1" }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ people, max = 3 }: { people: { name: string; avatarColor?: string | null; avatarUrl?: string | null }[]; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} color={p.avatarColor} src={p.avatarUrl} size="xs" ring />
      ))}
      {extra > 0 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised text-[9px] font-semibold text-ink-muted ring-2 ring-surface">
          +{extra}
        </div>
      )}
    </div>
  );
}
