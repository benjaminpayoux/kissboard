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

    this.version(2)
      .stores({
        projects: "id, position, createdAt, updatedAt",
        tasks: "id, projectId, status, position, createdAt, updatedAt",
        images: "id, taskId, createdAt",
      })
      .upgrade(async (tx) => {
        const projects = await tx.table("projects").toArray();
        const sorted = projects.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        for (let i = 0; i < sorted.length; i++) {
          await tx.table("projects").update(sorted[i].id, { position: i });
        }
      });
  }
}
