"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ProjectRow, ProjectRowOverlay } from "./ProjectRow";
import { useProjects } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const { moveProject } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const project = localProjects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = localProjects.findIndex((p) => p.id === active.id);
    const overIndex = localProjects.findIndex((p) => p.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      setLocalProjects(arrayMove(localProjects, activeIndex, overIndex));
      await moveProject(active.id as string, overIndex);
    }
  };

  if (localProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-lg">No projects yet.</p>
        <p className="text-muted mt-1">Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localProjects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {localProjects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeProject ? <ProjectRowOverlay project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
