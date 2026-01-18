export type TaskStatus = "todo" | "in_progress" | "done";

export interface Project {
  id: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskImage {
  id: string;
  taskId: string;
  data: Blob;
  name: string;
  mimeType: string;
  createdAt: Date;
}
