import React from "react";

export function renderMentions(body: string): React.ReactNode[] {
  const parts = body.split(/(@[A-Za-z][A-Za-z0-9_.-]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="rounded bg-accent-muted px-1 py-0.5 font-medium text-accent">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
