import { NextRequest } from "next/server";
import { createCommentSchema, can, rooms, extractMentions } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { recordAudit, enqueueEmail } from "@/lib/queue";

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: params.taskId },
      include: { project: { include: { workspace: { select: { orgId: true } }, members: { include: { user: true } } } } },
    });
    const role = await getProjectRole(user.id, task.projectId);
    if (!can(role, "comment.create")) throw new ApiError(403, "Not authorized to comment on this task");

    const body = createCommentSchema.parse(await req.json());
    const ref = `${task.project.key}-${task.number}`;

    const candidates = task.project.members.map((m) => ({ userId: m.user.id, name: m.user.name }));
    const mentioned = extractMentions(body.body, candidates).filter((m) => m.userId !== user.id);

    const comment = await prisma.comment.create({
      data: {
        taskId: params.taskId,
        authorId: user.id,
        body: body.body,
        mentions: { create: mentioned.map((m) => ({ mentionedUserId: m.userId })) },
      },
      include: { author: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } },
    });

    await publishEvent({
      type: "comment.created",
      room: rooms.board(task.boardId),
      payload: { taskId: task.id, commentId: comment.id, authorId: user.id },
    });

    await recordAudit({
      orgId: task.project.workspace.orgId,
      actorId: user.id,
      action: "comment.created",
      entityType: "comment",
      entityId: comment.id,
      metadata: { taskRef: ref },
    });

    const excerpt = body.body.length > 140 ? `${body.body.slice(0, 140)}…` : body.body;
    const link = `/projects/${task.projectId}/board?task=${task.id}`;

    for (const m of mentioned) {
      await prisma.notification.create({
        data: {
          recipientId: m.userId,
          actorId: user.id,
          type: "MENTION",
          title: `${user.name} mentioned you in ${ref}`,
          body: excerpt,
          link,
        },
      });
      await publishEvent({ type: "notification.created", room: rooms.user(m.userId), payload: { notificationId: comment.id, recipientId: m.userId } });
      const mentionedUser = task.project.members.find((mem) => mem.user.id === m.userId)?.user;
      if (mentionedUser) {
        await enqueueEmail({
          name: "mention",
          to: mentionedUser.email,
          data: { actorName: user.name, taskRef: ref, taskTitle: task.title, excerpt, link },
        });
      }
    }

    // Notify assignees who weren't mentioned and aren't the commenter, so
    // they still hear about activity on their own tasks.
    const assignees = await prisma.taskAssignee.findMany({ where: { taskId: task.id }, include: { user: true } });
    for (const a of assignees) {
      if (a.userId === user.id || mentioned.some((m) => m.userId === a.userId)) continue;
      await prisma.notification.create({
        data: {
          recipientId: a.userId,
          actorId: user.id,
          type: "COMMENT",
          title: `${user.name} commented on ${ref}`,
          body: excerpt,
          link,
        },
      });
      await publishEvent({ type: "notification.created", room: rooms.user(a.userId), payload: { notificationId: comment.id, recipientId: a.userId } });
      await enqueueEmail({
        name: "comment",
        to: a.user.email,
        data: { actorName: user.name, taskRef: ref, excerpt, link },
      });
    }

    return json({ comment }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
