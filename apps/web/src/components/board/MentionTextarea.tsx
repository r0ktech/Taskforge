"use client";
import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { BoardUser } from "./types";
import { cn } from "@/lib/cn";

export function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  members: BoardUser[];
  placeholder?: string;
  rows?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = React.useState<string | null>(null);
  const [mentionStart, setMentionStart] = React.useState<number | null>(null);

  const matches = query === null ? [] : members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(v);
    const cursor = e.target.selectionStart;
    const upToCursor = v.slice(0, cursor);
    const match = upToCursor.match(/(?:^|\s)@([A-Za-z]*)$/);
    if (match) {
      setQuery(match[1]);
      setMentionStart(cursor - match[1].length - 1);
    } else {
      setQuery(null);
      setMentionStart(null);
    }
  }

  function insertMention(member: BoardUser) {
    if (mentionStart === null) return;
    const handle = member.name.split(" ")[0];
    const cursor = ref.current?.selectionStart ?? value.length;
    const next = `${value.slice(0, mentionStart)}@${handle} ${value.slice(cursor)}`;
    onChange(next);
    setQuery(null);
    setMentionStart(null);
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "tf-focus-ring w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint",
          "hover:border-ink-faint"
        )}
      />
      {matches.length > 0 && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-56 overflow-hidden rounded-md border border-border bg-surface-raised shadow-panel">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-accent-muted"
            >
              <Avatar name={m.name} color={m.avatarColor} src={m.avatarUrl} size="xs" />
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
