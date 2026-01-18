"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useTasks } from "@/lib/db/hooks";
import type { Task, TaskStatus } from "@/lib/types";

interface BoardProps {
  projectId: string;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function Board({ projectId }: BoardProps) {
  const { tasks, createTask, moveTask } = useTasks(projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: handle drag over for visual feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !tasks) return;

    const activeTaskId = active.id as string;
    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    let newStatus: TaskStatus;
    let newPosition: number;

    const overTask = tasks.find((t) => t.id === over.id);

    if (overTask) {
      newStatus = overTask.status;
      const tasksInColumn = tasks
        .filter((t) => t.status === newStatus && t.id !== activeTaskId)
        .sort((a, b) => a.position - b.position);

      const overIndex = tasksInColumn.findIndex((t) => t.id === over.id);
      if (overIndex === -1) {
        newPosition = tasksInColumn.length;
      } else {
        newPosition = overIndex;
      }
    } else {
      newStatus = over.id as TaskStatus;
      const tasksInColumn = tasks
        .filter((t) => t.status === newStatus && t.id !== activeTaskId)
        .sort((a, b) => a.position - b.position);
      newPosition = tasksInColumn.length;
    }

    if (activeTask.status !== newStatus || activeTask.position !== newPosition) {
      await moveTask(activeTaskId, newStatus, newPosition);
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (title: string) => {
    await createTask(title, createStatus);
    setIsCreateModalOpen(false);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks?.filter((t) => t.status === status) ?? [];
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
              onAddTask={handleAddTask}
              onEditTask={setEditingTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragging onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        onSubmit={handleCreateTask}
        mode="create"
      />

      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          projectId={projectId}
          task={editingTask}
          mode="edit"
        />
      )}
    </>
  );
}
