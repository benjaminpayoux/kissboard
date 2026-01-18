"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useProjectTaskCount } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

interface ProjectRowProps {
  project: Project;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const taskCount = useProjectTaskCount(project.id);

  return (
    <Link href={`/project/${project.id}`}>
      <div className="group flex items-center justify-between px-5 py-4 bg-surface border border-border rounded-xl cursor-pointer transition-colors duration-200 hover:bg-column">
        <span className="font-medium transition-colors duration-300 group-hover:text-accent">
          {project.name}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            <span className="font-mono tabular-nums">{taskCount}</span> {taskCount === 1 ? "task" : "tasks"}
          </span>
          <ChevronRight className="w-4 h-4 text-muted/50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
      </div>
    </Link>
  );
}
