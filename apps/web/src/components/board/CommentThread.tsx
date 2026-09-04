"use client";
import * as React from "react";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MentionTextarea } from "./MentionTextarea";
import { renderMentions } from "./renderMentions";
import type { BoardUser } from "./types";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: BoardUser;
}

export function CommentThread({
  taskId,
  members,
  comments,
  onCommentAdded,
}: {
  taskId: string;
  members: BoardUser[];
  comments: CommentItem[];
  onCommentAdded: (comment: CommentItem) => void;
}) {
  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not post comment");
      return;
    }
    onCommentAdded(data.comment);
    setBody("");
  }

  return (
    <div>
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar name={c.author.name} color={c.author.avatarColor} src={c.author.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-medium text-ink">{c.author.name}</span>
                <span className="text-[11px] text-ink-faint">{formatDistanceToNowStrict(new Date(c.createdAt))} ago</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">{renderMentions(c.body)}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-[13px] text-ink-faint">No comments yet — start the conversation.</p>}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <MentionTextarea value={body} onChange={setBody} members={members} placeholder="Add a comment, @mention a teammate..." />
        </div>
        <Button size="icon" onClick={submit} disabled={posting || !body.trim()}>
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
