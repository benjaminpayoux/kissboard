"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";

import { arrayMove } from "@dnd-kit/sortable";

import { Column } from "./Column";
import { TaskCardOverlay } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useTasks } from "@/lib/db/hooks";
import type { Task, TaskStatus } from "@/lib/types";

const DROP_ANIMATION_DURATION = 150;

const dropAnimation: DropAnimation = {
  duration: DROP_ANIMATION_DURATION,
  easing: "ease-out",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0",
      },
    },
  }),
};

interface BoardProps {
  projectId: string;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function Board({ projectId }: BoardProps) {
  const { tasks: dbTasks, createTask, moveTask } = useTasks(projectId);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [pendingMove, setPendingMove] = useState<{ taskId: string; status: TaskStatus; position: number } | null>(null);
  const tasks = optimisticTasks ?? dbTasks;
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [droppingTask, setDroppingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  useEffect(() => {
    if (!pendingMove || !dbTasks) return;
    const dbTask = dbTasks.find((t) => t.id === pendingMove.taskId);
    if (dbTask && dbTask.status === pendingMove.status && dbTask.position === pendingMove.position) {
      queueMicrotask(() => {
        setPendingMove(null);
        setOptimisticTasks(null);
      });
    }
  }, [dbTasks, pendingMove]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return (tasks ?? [])
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
    },
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = dbTasks?.find((t) => t.id === event.active.id);
    if (task) {
      setOptimisticTasks(dbTasks ?? []);
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !optimisticTasks) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = optimisticTasks.find((t) => t.id === activeId);
    const overTask = optimisticTasks.find((t) => t.id === overId);

    if (!activeTask) return;

    const overStatus = overTask ? overTask.status : (overId as TaskStatus);
    const isValidColumn = columns.some((c) => c.status === overStatus);

    if (activeTask.status !== overStatus && isValidColumn) {
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;
      const isBelowMiddle = activeRect && overRect
        ? activeRect.top > overRect.top + overRect.height / 2
        : false;

      setOptimisticTasks((prev) => {
        if (!prev) return prev;
        const task = prev.find((t) => t.id === activeId);
        if (!task || task.status === overStatus) return prev;

        const tasksInTargetColumn = prev
          .filter((t) => t.status === overStatus && t.id !== activeId)
          .sort((a, b) => a.position - b.position);

        let newPosition: number;
        if (overTask) {
          const overIndex = tasksInTargetColumn.findIndex((t) => t.id === overId);
          const basePosition = overIndex >= 0 ? overIndex : tasksInTargetColumn.length;
          newPosition = isBelowMiddle ? basePosition + 1 : basePosition;
        } else {
          newPosition = tasksInTargetColumn.length;
        }

        tasksInTargetColumn.splice(newPosition, 0, { ...task, status: overStatus, position: newPosition });
        const updatedColumnTasks = tasksInTargetColumn.map((t, i) => ({ ...t, position: i }));
        const tasksOutsideColumn = prev.filter((t) => t.status !== overStatus && t.id !== activeId);

        return [...tasksOutsideColumn, ...updatedColumnTasks];
      });
    } else if (overTask && activeTask.status === overStatus) {
      const columnTasks = optimisticTasks
        .filter((t) => t.status === overStatus)
        .sort((a, b) => a.position - b.position);

      const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
      const overIndex = columnTasks.findIndex((t) => t.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setOptimisticTasks((prev) => {
          if (!prev) return prev;
          const reordered = arrayMove(columnTasks, activeIndex, overIndex);
          const updatedColumnTasks = reordered.map((t, i) => ({ ...t, position: i }));
          const tasksOutsideColumn = prev.filter((t) => t.status !== overStatus);
          return [...tasksOutsideColumn, ...updatedColumnTasks];
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !optimisticTasks) {
      if (activeTask) {
        setDroppingTask(activeTask);
        setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);
      }
      setActiveTask(null);
      setOptimisticTasks(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedTask = optimisticTasks.find((t) => t.id === activeId);
    const overTask = optimisticTasks.find((t) => t.id === overId);

    if (!draggedTask) {
      if (activeTask) {
        setDroppingTask(activeTask);
        setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);
      }
      setActiveTask(null);
      setOptimisticTasks(null);
      return;
    }

    const overStatus = overTask ? overTask.status : (overId as TaskStatus);
    const columnTasks = optimisticTasks
      .filter((t) => t.status === overStatus)
      .sort((a, b) => a.position - b.position);

    const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
    const overIndex = overTask
      ? columnTasks.findIndex((t) => t.id === overId)
      : columnTasks.length;

    let newPosition = overIndex;
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const reordered = arrayMove(columnTasks, activeIndex, overIndex);
      newPosition = reordered.findIndex((t) => t.id === activeId);
    } else if (activeIndex === -1) {
      newPosition = overIndex >= 0 ? overIndex : columnTasks.length;
    }

    setOptimisticTasks((prev) => {
      if (!prev) return prev;
      const otherTasks = prev.filter((t) => t.id !== activeId);
      const tasksInColumn = otherTasks
        .filter((t) => t.status === overStatus)
        .sort((a, b) => a.position - b.position);

      tasksInColumn.splice(newPosition, 0, { ...draggedTask, status: overStatus, position: newPosition });

      const updatedColumnTasks = tasksInColumn.map((t, i) => ({ ...t, position: i }));
      const tasksOutsideColumn = otherTasks.filter((t) => t.status !== overStatus);

      return [...tasksOutsideColumn, ...updatedColumnTasks];
    });

    setPendingMove({ taskId: activeId, status: overStatus, position: newPosition });
    setDroppingTask(activeTask);
    setActiveTask(null);
    setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);

    await moveTask(activeId, overStatus, newPosition);
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (title: string) => {
    await createTask(title, createStatus);
    setIsCreateModalOpen(false);
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
        <div className="flex items-start gap-6 overflow-x-auto h-full p-1 -m-1 pb-4">
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

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask && <TaskCardOverlay task={activeTask} />}
          {droppingTask && <TaskCardOverlay task={droppingTask} isSkeleton />}
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
