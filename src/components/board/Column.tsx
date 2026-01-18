"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function Column({ status, title, tasks, onAddTask, onEditTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col min-w-[300px] w-full max-w-[350px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          <span className="text-sm text-muted font-mono bg-column px-2 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-column transition-colors duration-200"
          aria-label={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 bg-column rounded-xl p-3 min-h-[200px]
          transition-colors duration-200
          ${isOver ? "bg-accent/5 ring-2 ring-accent/20" : ""}
        `}
      >
        <SortableContext
          items={sortedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[150px] text-muted text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
