import Dexie, { type EntityTable } from "dexie";
import type { Project, Task, TaskImage } from "../types";

export class KissboardDatabase extends Dexie {
  projects!: EntityTable<Project, "id">;
  tasks!: EntityTable<Task, "id">;
  images!: EntityTable<TaskImage, "id">;

  constructor() {
    super("kissboard");

    this.version(1).stores({
      projects: "id, createdAt, updatedAt",
      tasks: "id, projectId, status, position, createdAt, updatedAt",
      images: "id, taskId, createdAt",
    });
  }
}
