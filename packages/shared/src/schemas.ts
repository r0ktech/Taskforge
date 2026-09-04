import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  orgName: z.string().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  key: z.string().regex(/^[A-Z]{2,6}$/, "2-6 uppercase letters, e.g. ENG"),
  description: z.string().max(500).optional(),
  teamId: z.string().cuid().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  columnId: z.string().cuid(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeIds: z.array(z.string().cuid()).default([]),
  labelIds: z.array(z.string().cuid()).default([]),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeIds: z.array(z.string().cuid()).optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().cuid(),
  order: z.number(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const createColumnSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  wipLimit: z.number().int().positive().optional().nullable(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
