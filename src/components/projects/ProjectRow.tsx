"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical } from "lucide-react";
import { useProjectTaskCount } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

interface ProjectRowProps {
  project: Project;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const taskCount = useProjectTaskCount(project.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 250ms ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center bg-surface border border-border rounded-xl transition-colors duration-200 hover:bg-column ${
        isDragging ? "opacity-40" : ""
      }`}
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
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              <span className="font-mono tabular-nums">{taskCount}</span> {taskCount === 1 ? "task" : "tasks"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </div>
        </div>
      </Link>
    </div>
  );
}

interface ProjectRowOverlayProps {
  project: Project;
}

export function ProjectRowOverlay({ project }: ProjectRowOverlayProps) {
  const taskCount = useProjectTaskCount(project.id);

  return (
    <div className="flex items-center bg-surface border border-border rounded-xl opacity-80 shadow-lg">
      <div className="flex items-center justify-center w-10 h-full py-4">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-2 pr-5 py-4">
          <span className="font-medium text-foreground truncate">
            {project.name}
          </span>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              <span className="font-mono tabular-nums">{taskCount}</span> {taskCount === 1 ? "task" : "tasks"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
