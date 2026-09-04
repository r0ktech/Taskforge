"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, AtSign, MessageSquare, UserPlus, ArrowRightLeft, Mail } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useSession } from "@/providers/SessionProvider";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string; avatarColor: string; avatarUrl: string | null } | null;
}

const ICONS: Record<string, React.ElementType> = {
  MENTION: AtSign,
  COMMENT: MessageSquare,
  ASSIGNED: UserPlus,
  TASK_MOVED: ArrowRightLeft,
  INVITATION: Mail,
  WORKSPACE_INVITE: Mail,
  TASK_DUE_SOON: Bell,
  SYSTEM: Bell,
};

export function NotificationBell() {
  const { user } = useSession();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useSocketRoom(user ? `user:${user.id}` : null, {
    "notification.created": () => void load(),
  });

  async function markAllRead() {
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  async function markRead(id: string) {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="tf-focus-ring relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} className="w-[calc(100vw-1.5rem)] max-w-xs p-0 sm:w-80 sm:max-w-none">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-[13px] font-semibold text-ink">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[12px] font-medium text-accent hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] text-ink-faint">You're all caught up.</p>
          )}
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-surface-raised",
                  !n.isRead && "bg-accent-muted/30"
                )}
              >
                {n.actor ? (
                  <Avatar name={n.actor.name} color={n.actor.avatarColor} src={n.actor.avatarUrl} size="sm" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised text-ink-faint">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 truncate text-[12px] text-ink-muted">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-ink-faint">{formatDistanceToNowStrict(new Date(n.createdAt))} ago</p>
                </div>
                {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
