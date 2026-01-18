"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Image as ImageIcon } from "lucide-react";
import { useTaskImageCount } from "@/lib/db/hooks";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const imageCount = useTaskImageCount(task.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-surface border border-border rounded-lg p-4 cursor-pointer
        transition-all duration-200
        hover:shadow-md hover:border-accent/20
        ${isBeingDragged ? "shadow-lg opacity-90 rotate-2 scale-105" : ""}
      `}
    >
      <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>

      {imageCount > 0 && (
        <div className="flex items-center gap-1 mt-2 text-muted text-xs">
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="font-mono">{imageCount}</span>
        </div>
      )}
    </div>
  );
}
