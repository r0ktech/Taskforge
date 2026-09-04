import { PrismaClient, Role, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  console.log("Seeding Task Forge demo data...");

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [ava, ben, cleo, dax, elle] = await Promise.all(
    [
      { email: "ava@taskforge.dev", name: "Ava Whitfield", avatarColor: "#6366F1", title: "Head of Product" },
      { email: "ben@taskforge.dev", name: "Ben Okafor", avatarColor: "#0EA5E9", title: "Engineering Lead" },
      { email: "cleo@taskforge.dev", name: "Cleo Martins", avatarColor: "#F59E0B", title: "Product Designer" },
      { email: "dax@taskforge.dev", name: "Dax Chen", avatarColor: "#10B981", title: "Backend Engineer" },
      { email: "elle@taskforge.dev", name: "Elle Bergström", avatarColor: "#EC4899", title: "QA Engineer" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash },
      })
    )
  );

  const org = await prisma.organization.upsert({
    where: { slug: "taskforge-labs" },
    update: {},
    create: { name: "Task Forge Labs", slug: "taskforge-labs" },
  });

  await prisma.organizationMember.createMany({
    data: [
      { orgId: org.id, userId: ava.id, role: Role.OWNER },
      { orgId: org.id, userId: ben.id, role: Role.ADMIN },
      { orgId: org.id, userId: cleo.id, role: Role.MEMBER },
      { orgId: org.id, userId: dax.id, role: Role.MEMBER },
      { orgId: org.id, userId: elle.id, role: Role.MEMBER },
    ],
    skipDuplicates: true,
  });

  const workspace = await prisma.workspace.upsert({
    where: { orgId_slug: { orgId: org.id, slug: "product" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Product",
      slug: "product",
      description: "Everything we ship, from discovery to release.",
      color: "#6366F1",
    },
  });

  await prisma.workspaceMember.createMany({
    data: [ava, ben, cleo, dax, elle].map((u) => ({
      workspaceId: workspace.id,
      userId: u.id,
      role: u.id === ava.id ? Role.OWNER : Role.MEMBER,
    })),
    skipDuplicates: true,
  });

  const team = await prisma.team.create({
    data: {
      workspaceId: workspace.id,
      name: "Core Platform",
      description: "Owns the main application platform and infra.",
      color: "#0EA5E9",
      members: {
        create: [ben, dax, elle].map((u) => ({
          userId: u.id,
          role: u.id === ben.id ? Role.ADMIN : Role.MEMBER,
        })),
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { workspaceId_key: { workspaceId: workspace.id, key: "ENG" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      teamId: team.id,
      name: "Engineering Roadmap",
      key: "ENG",
      description: "Sprint work for the Task Forge core application.",
      color: "#6366F1",
      members: {
        create: [ava, ben, cleo, dax, elle].map((u) => ({ userId: u.id, role: Role.MEMBER })),
      },
    },
  });

  const board = await prisma.board.create({
    data: { projectId: project.id, name: "Sprint Board" },
  });

  const columnDefs = [
    { name: "Backlog", color: "#94A3B8" },
    { name: "To Do", color: "#64748B" },
    { name: "In Progress", color: "#6366F1" },
    { name: "In Review", color: "#F59E0B" },
    { name: "Done", color: "#10B981", isDoneColumn: true },
  ];

  const columns = [];
  for (let i = 0; i < columnDefs.length; i++) {
    const def = columnDefs[i];
    columns.push(
      await prisma.boardColumn.create({
        data: { boardId: board.id, name: def.name, order: i, color: def.color, isDoneColumn: !!def.isDoneColumn },
      })
    );
  }

  const labels = await Promise.all(
    [
      { name: "Bug", color: "#EF4444" },
      { name: "Feature", color: "#6366F1" },
      { name: "Design", color: "#EC4899" },
      { name: "Infra", color: "#0EA5E9" },
    ].map((l) => prisma.label.create({ data: { projectId: project.id, name: l.name, color: l.color } }))
  );

  const taskSeeds: Array<{
    title: string;
    description: string;
    column: number;
    priority: TaskPriority;
    assignees: string[];
    labels: number[];
  }> = [
    {
      title: "Design real-time presence indicators",
      description: "Show avatars of teammates currently viewing a board, similar to Figma's cursors.",
      column: 0,
      priority: TaskPriority.LOW,
      assignees: [cleo.id],
      labels: [2],
    },
    {
      title: "Draft Q3 roadmap review deck",
      description: "Summarize shipped work and propose the next quarter's themes.",
      column: 0,
      priority: TaskPriority.MEDIUM,
      assignees: [ava.id],
      labels: [1],
    },
    {
      title: "Set up BullMQ dead-letter queue",
      description: "Failed jobs should retry with backoff and land in a DLQ for inspection.",
      column: 1,
      priority: TaskPriority.MEDIUM,
      assignees: [dax.id],
      labels: [3],
    },
    {
      title: "Fix drag-and-drop jump on fast reorder",
      description: "Cards briefly flicker to the wrong column when dragged quickly across boundaries.",
      column: 2,
      priority: TaskPriority.HIGH,
      assignees: [ben.id, cleo.id],
      labels: [0],
    },
    {
      title: "Wire mentions to notification worker",
      description: "@mentions in comments should enqueue an email + in-app notification job.",
      column: 2,
      priority: TaskPriority.HIGH,
      assignees: [dax.id],
      labels: [1, 3],
    },
    {
      title: "Add audit log viewer with filters",
      description: "Org admins should be able to filter by actor, action type, and date range.",
      column: 3,
      priority: TaskPriority.MEDIUM,
      assignees: [ben.id],
      labels: [1],
    },
    {
      title: "QA pass on invitation flow",
      description: "Verify expired and revoked invitation tokens are rejected with a clear message.",
      column: 3,
      priority: TaskPriority.URGENT,
      assignees: [elle.id],
      labels: [0],
    },
    {
      title: "Ship WebSocket reconnect + backfill",
      description: "On reconnect, replay any board events missed while offline via a since-timestamp fetch.",
      column: 4,
      priority: TaskPriority.HIGH,
      assignees: [dax.id, ben.id],
      labels: [3],
    },
    {
      title: "Kanban column color customization",
      description: "Let project admins recolor columns from the board settings menu.",
      column: 4,
      priority: TaskPriority.LOW,
      assignees: [cleo.id],
      labels: [1, 2],
    },
  ];

  let seq = 0;
  for (const t of taskSeeds) {
    seq += 1;
    const task = await prisma.task.create({
      data: {
        number: seq,
        projectId: project.id,
        boardId: board.id,
        columnId: columns[t.column].id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        order: seq * 1000,
        createdById: ava.id,
        assignees: { create: t.assignees.map((userId) => ({ userId })) },
        labels: { create: t.labels.map((idx) => ({ labelId: labels[idx].id })) },
      },
    });

    if (t.column >= 2) {
      await prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: t.assignees[0],
          body: `Picking this up now — will post an update once I have something to review. cc @${ava.name.split(" ")[0]}`,
        },
      });
    }
  }

  await prisma.project.update({ where: { id: project.id }, data: { taskSeq: seq } });

  await prisma.notification.createMany({
    data: [
      {
        recipientId: ava.id,
        actorId: dax.id,
        type: "MENTION",
        title: "Dax Chen mentioned you",
        body: "in ENG-5: Wire mentions to notification worker",
        link: "/w/product/projects/ENG/board",
      },
      {
        recipientId: ben.id,
        actorId: elle.id,
        type: "COMMENT",
        title: "Elle Bergström commented",
        body: "on ENG-7: QA pass on invitation flow",
        link: "/w/product/projects/ENG/board",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { orgId: org.id, actorId: ava.id, action: "organization.created", entityType: "organization", entityId: org.id },
      { orgId: org.id, actorId: ava.id, action: "workspace.created", entityType: "workspace", entityId: workspace.id },
      { orgId: org.id, actorId: ben.id, action: "project.created", entityType: "project", entityId: project.id },
      { orgId: org.id, actorId: dax.id, action: "task.created", entityType: "task", entityId: null, metadata: { count: seq } },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login: ava@taskforge.dev / " + PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
