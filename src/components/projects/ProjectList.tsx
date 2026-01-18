"use client";

import { ProjectCard } from "./ProjectCard";
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
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
