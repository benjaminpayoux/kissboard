"use client";

import Link from "next/link";
import { useSortable, defaultAnimateLayoutChanges, AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical } from "lucide-react";
import { useProjectProgress } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

interface ProjectRowProps {
  project: Project;
  isOverlay?: boolean;
}

export function ProjectRow({ project, isOverlay = false }: ProjectRowProps) {
  const { total, progress } = useProjectProgress(project.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, animateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isOverlay) {
    return (
      <div className="flex items-center bg-surface border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-center w-10 h-full py-4">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-2 pr-5 py-4">
            <span className="font-medium text-foreground truncate">
              {project.name}
            </span>
            <div className="flex items-center gap-4 shrink-0">
              {total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono tabular-nums w-9 text-right">
                    {progress}%
                  </span>
                </div>
              )}
              <span className="text-sm text-muted-foreground w-16 text-right">
                <span className="font-mono tabular-nums">{total}</span> {total === 1 ? "task" : "tasks"}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center bg-primary/10 border border-dashed border-primary/40 rounded-xl"
      >
        <div className="flex items-center justify-center w-10 h-full py-4">
          <GripVertical className="w-4 h-4 invisible" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-2 pr-5 py-4">
            <span className="font-medium invisible">{project.name}</span>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-sm invisible">
                <span className="font-mono tabular-nums">{total}</span> {total === 1 ? "task" : "tasks"}
              </span>
              <ChevronRight className="w-4 h-4 invisible" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center bg-surface border border-border rounded-xl transition-colors duration-200 hover:border-foreground/30"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-10 h-full py-4 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </button>

      <Link href={`/project/${project.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-2 pr-5 py-4">
          <span className="font-medium text-foreground truncate">
            {project.name}
          </span>
          <div className="flex items-center gap-4 shrink-0">
            {total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono tabular-nums w-9 text-right">
                  {progress}%
                </span>
              </div>
            )}
            <span className="text-sm text-muted-foreground w-16 text-right">
              <span className="font-mono tabular-nums">{total}</span> {total === 1 ? "task" : "tasks"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </div>
        </div>
      </Link>
    </div>
  );
}
