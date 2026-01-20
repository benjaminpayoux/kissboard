"use client";

import { useSortable, defaultAnimateLayoutChanges, AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Image as ImageIcon, AlignLeft } from "lucide-react";
import { useTaskImageCount } from "@/lib/db/hooks";
import type { Task } from "@/lib/types";

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

interface TaskCardPresentationalProps {
  task: Task;
  imageCount: number;
  isOverlay?: boolean;
  onClick?: () => void;
}

function TaskCardPresentational({
  task,
  imageCount,
  isOverlay = false,
  onClick
}: TaskCardPresentationalProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface border border-border rounded-lg p-4
        ${isOverlay ? "shadow-xl cursor-grabbing" : "cursor-pointer hover:shadow-md hover:border-ring"}
        ${!isOverlay ? "transition-colors duration-200" : ""}
      `}
    >
      <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
      {(task.description || imageCount > 0) && (
        <div className="flex items-center gap-3 mt-2 text-muted-foreground text-xs">
          {task.description && <AlignLeft className="w-3.5 h-3.5" />}
          {imageCount > 0 && (
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="font-mono">{imageCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const imageCount = useTaskImageCount(task.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, animateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {isDragging ? (
        <div className="bg-primary/10 border border-dashed border-primary/40 rounded-lg p-4 opacity-100">
          <h3 className="font-medium text-sm line-clamp-2 invisible">{task.title}</h3>
          {(task.description || imageCount > 0) && (
            <div className="flex items-center gap-3 mt-2 text-xs invisible">
              {task.description && <AlignLeft className="w-3.5 h-3.5" />}
              {imageCount > 0 && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="font-mono">{imageCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <TaskCardPresentational
          task={task}
          imageCount={imageCount}
          onClick={onClick}
        />
      )}
    </div>
  );
}

interface TaskCardOverlayProps {
  task: Task;
  isSkeleton?: boolean;
}

export function TaskCardOverlay({ task, isSkeleton }: TaskCardOverlayProps) {
  const imageCount = useTaskImageCount(task.id);

  if (isSkeleton) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 shadow-xl">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <TaskCardPresentational
      task={task}
      imageCount={imageCount}
      isOverlay
    />
  );
}
