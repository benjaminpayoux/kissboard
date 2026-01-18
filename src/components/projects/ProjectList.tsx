"use client";

import { ProjectRow } from "./ProjectRow";
import type { Project } from "@/lib/types";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-lg">No projects yet.</p>
        <p className="text-muted mt-1">Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
}
