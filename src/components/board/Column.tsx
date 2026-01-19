"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export function Column({ status, title, tasks, onEditTask }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex-1 min-w-[280px] flex flex-col max-h-full">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground font-mono bg-column px-2 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="bg-column rounded-xl p-2 flex-1 overflow-y-auto min-h-[70px] scrollbar-hidden"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onEditTask(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
