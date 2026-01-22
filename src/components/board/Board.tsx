"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { useTasks, fetchTasks } from "@/lib/db/hooks";
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
  requestAddTask?: number;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function Board({ projectId, requestAddTask }: BoardProps) {
  const { createTask, moveTask } = useTasks(projectId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [droppingTask, setDroppingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");
  const lastAddRequestRef = useRef(requestAddTask);

  useEffect(() => {
    fetchTasks(projectId).then(setTasks);
  }, [projectId]);

  useEffect(() => {
    if (requestAddTask !== undefined && requestAddTask !== lastAddRequestRef.current) {
      lastAddRequestRef.current = requestAddTask;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Responding to prop change
      setCreateStatus("todo");
      setIsCreateModalOpen(true);
    }
  }, [requestAddTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
    },
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    const isBelowMiddle = activeRect && overRect
      ? activeRect.top > overRect.top + overRect.height / 2
      : false;

    setTasks((prev) => {
      const activeTaskItem = prev.find((t) => t.id === activeId);
      const overTask = prev.find((t) => t.id === overId);

      if (!activeTaskItem) return prev;

      const overStatus = overTask ? overTask.status : (overId as TaskStatus);
      const isValidColumn = columns.some((c) => c.status === overStatus);

      if (activeTaskItem.status !== overStatus && isValidColumn) {
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

        tasksInTargetColumn.splice(newPosition, 0, { ...activeTaskItem, status: overStatus, position: newPosition });
        const updatedColumnTasks = tasksInTargetColumn.map((t, i) => ({ ...t, position: i }));
        const tasksOutsideColumn = prev.filter((t) => t.status !== overStatus && t.id !== activeId);

        return [...tasksOutsideColumn, ...updatedColumnTasks];
      }

      if (overTask && activeTaskItem.status === overStatus) {
        const columnTasks = prev
          .filter((t) => t.status === overStatus)
          .sort((a, b) => a.position - b.position);

        const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
        const overIndex = columnTasks.findIndex((t) => t.id === overId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const reordered = arrayMove(columnTasks, activeIndex, overIndex);
          const updatedColumnTasks = reordered.map((t, i) => ({ ...t, position: i }));
          const tasksOutsideColumn = prev.filter((t) => t.status !== overStatus);
          return [...tasksOutsideColumn, ...updatedColumnTasks];
        }
      }

      return prev;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      if (activeTask) {
        setDroppingTask(activeTask);
        setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);
      }
      setActiveTask(null);
      fetchTasks(projectId).then(setTasks);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!draggedTask) {
      if (activeTask) {
        setDroppingTask(activeTask);
        setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);
      }
      setActiveTask(null);
      return;
    }

    const overStatus = overTask ? overTask.status : (overId as TaskStatus);
    const columnTasks = tasks
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

    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.id !== activeId);
      const tasksInColumn = otherTasks
        .filter((t) => t.status === overStatus)
        .sort((a, b) => a.position - b.position);

      tasksInColumn.splice(newPosition, 0, { ...draggedTask, status: overStatus, position: newPosition });

      const updatedColumnTasks = tasksInColumn.map((t, i) => ({ ...t, position: i }));
      const tasksOutsideColumn = otherTasks.filter((t) => t.status !== overStatus);

      return [...tasksOutsideColumn, ...updatedColumnTasks];
    });

    setDroppingTask(activeTask);
    setActiveTask(null);
    setTimeout(() => setDroppingTask(null), DROP_ANIMATION_DURATION);

    await moveTask(activeId, overStatus, newPosition);
  };

  const handleCreateTask = async (title: string, description: string): Promise<string> => {
    const task = await createTask(title, createStatus, description);
    setTasks((prev) => [...prev, task]);
    setIsCreateModalOpen(false);
    return task.id;
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleTaskUpdated = async () => {
    const updatedTasks = await fetchTasks(projectId);
    setTasks(updatedTasks);
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
        <div className="flex items-start gap-6 h-full p-1 -m-1 pb-4">
          {columns.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
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
          onDeleted={handleTaskDeleted}
          onUpdated={handleTaskUpdated}
        />
      )}
    </>
  );
}
