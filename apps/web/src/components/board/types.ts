export interface BoardUser {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
}

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

export interface BoardTask {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  order: number;
  dueDate: string | null;
  columnId: string;
  boardId: string;
  projectId: string;
  createdById: string;
  assignees: { user: BoardUser }[];
  labels: { label: BoardLabel }[];
  _count: { comments: number; attachments: number };
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string;
  wipLimit: number | null;
  isDoneColumn: boolean;
  tasks: BoardTask[];
}

export interface BoardData {
  id: string;
  name: string;
  columns: BoardColumn[];
}

export interface ProjectData {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  color: string;
  description: string | null;
  labels: BoardLabel[];
  members: { user: BoardUser }[];
  boards: BoardData[];
}
