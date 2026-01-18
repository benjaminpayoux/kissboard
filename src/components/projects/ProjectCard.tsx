"use client";

import Link from "next/link";
import { Calendar, ListTodo } from "lucide-react";
import { useProjectTaskCount } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const taskCount = useProjectTaskCount(project.id);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Link href={`/project/${project.id}`}>
      <article className="bg-surface border border-border rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-accent/20 cursor-pointer group">
        <h3 className="text-lg font-semibold mb-4 group-hover:text-accent transition-colors duration-200">
          {project.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <ListTodo className="w-4 h-4" />
            <span className="font-mono">{taskCount}</span>
            <span>tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
