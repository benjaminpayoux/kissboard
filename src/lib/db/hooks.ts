"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { db } from "./index";
import type { Project, Task, TaskImage, TaskStatus } from "../types";

export function useProjects() {
  const projects = useLiveQuery(() =>
    db.projects.orderBy("updatedAt").reverse().toArray()
  );

  const createProject = async (name: string): Promise<Project> => {
    const now = new Date();
    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  };

  const updateProject = async (
    id: string,
    updates: Partial<Pick<Project, "name">>
  ) => {
    await db.projects.update(id, { ...updates, updatedAt: new Date() });
  };

  const deleteProject = async (id: string) => {
    await db.transaction("rw", [db.projects, db.tasks, db.images], async () => {
      const tasks = await db.tasks.where("projectId").equals(id).toArray();
      const taskIds = tasks.map((t) => t.id);

      await db.images.where("taskId").anyOf(taskIds).delete();
      await db.tasks.where("projectId").equals(id).delete();
      await db.projects.delete(id);
    });
  };

  return { projects, createProject, updateProject, deleteProject };
}

export function useProject(id: string) {
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  return project;
}

export function useTasks(projectId: string) {
  const tasks = useLiveQuery(
    () => db.tasks.where("projectId").equals(projectId).toArray(),
    [projectId]
  );

  const getNextPosition = async (status: TaskStatus): Promise<number> => {
    const tasksInStatus = await db.tasks
      .where("projectId")
      .equals(projectId)
      .filter((t) => t.status === status)
      .toArray();
    if (tasksInStatus.length === 0) return 0;
    return Math.max(...tasksInStatus.map((t) => t.position)) + 1;
  };

  const createTask = async (
    title: string,
    status: TaskStatus = "todo"
  ): Promise<Task> => {
    const now = new Date();
    const position = await getNextPosition(status);
    const task: Task = {
      id: uuidv4(),
      projectId,
      title,
      description: "",
      status,
      position,
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.add(task);
    return task;
  };

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "status" | "position">>
  ) => {
    await db.tasks.update(id, { ...updates, updatedAt: new Date() });
  };

  const moveTask = async (
    id: string,
    newStatus: TaskStatus,
    newPosition: number
  ) => {
    await db.transaction("rw", db.tasks, async () => {
      const task = await db.tasks.get(id);
      if (!task) return;

      const oldStatus = task.status;
      const oldPosition = task.position;

      if (oldStatus === newStatus) {
        const tasksInColumn = await db.tasks
          .where("projectId")
          .equals(projectId)
          .filter((t) => t.status === newStatus && t.id !== id)
          .toArray();

        for (const t of tasksInColumn) {
          if (oldPosition < newPosition) {
            if (t.position > oldPosition && t.position <= newPosition) {
              await db.tasks.update(t.id, { position: t.position - 1 });
            }
          } else {
            if (t.position >= newPosition && t.position < oldPosition) {
              await db.tasks.update(t.id, { position: t.position + 1 });
            }
          }
        }
      } else {
        const oldColumnTasks = await db.tasks
          .where("projectId")
          .equals(projectId)
          .filter((t) => t.status === oldStatus && t.id !== id)
          .toArray();

        for (const t of oldColumnTasks) {
          if (t.position > oldPosition) {
            await db.tasks.update(t.id, { position: t.position - 1 });
          }
        }

        const newColumnTasks = await db.tasks
          .where("projectId")
          .equals(projectId)
          .filter((t) => t.status === newStatus)
          .toArray();

        for (const t of newColumnTasks) {
          if (t.position >= newPosition) {
            await db.tasks.update(t.id, { position: t.position + 1 });
          }
        }
      }

      await db.tasks.update(id, {
        status: newStatus,
        position: newPosition,
        updatedAt: new Date(),
      });
    });
  };

  const deleteTask = async (id: string) => {
    await db.transaction("rw", [db.tasks, db.images], async () => {
      await db.images.where("taskId").equals(id).delete();
      await db.tasks.delete(id);
    });
  };

  return { tasks, createTask, updateTask, moveTask, deleteTask };
}

export function useTaskImages(taskId: string) {
  const images = useLiveQuery(
    () => db.images.where("taskId").equals(taskId).toArray(),
    [taskId]
  );

  const addImage = async (
    data: Blob,
    name: string,
    mimeType: string
  ): Promise<TaskImage> => {
    const image: TaskImage = {
      id: uuidv4(),
      taskId,
      data,
      name,
      mimeType,
      createdAt: new Date(),
    };
    await db.images.add(image);
    return image;
  };

  const deleteImage = async (id: string) => {
    await db.images.delete(id);
  };

  return { images, addImage, deleteImage };
}

export function useTaskImageCount(taskId: string) {
  const count = useLiveQuery(
    () => db.images.where("taskId").equals(taskId).count(),
    [taskId]
  );
  return count ?? 0;
}

export function useProjectTaskCount(projectId: string) {
  const count = useLiveQuery(
    () => db.tasks.where("projectId").equals(projectId).count(),
    [projectId]
  );
  return count ?? 0;
}

export function useHasProjects() {
  const count = useLiveQuery(() => db.projects.count());
  return count !== undefined && count > 0;
}
