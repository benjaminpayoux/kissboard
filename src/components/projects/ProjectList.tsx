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
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ProjectRow } from "./ProjectRow";
import { useProjects } from "@/lib/db/hooks";
import type { Project } from "@/lib/types";

const dropAnimation: DropAnimation = {
  duration: 150,
  easing: "ease-out",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0",
      },
    },
  }),
};

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const { moveProject } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [optimisticProjects, setOptimisticProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    queueMicrotask(() => setOptimisticProjects(null));
  }, [projects]);

  const displayedProjects = optimisticProjects ?? projects;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const project = displayedProjects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = displayedProjects.findIndex((p) => p.id === active.id);
    const overIndex = displayedProjects.findIndex((p) => p.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const reordered = arrayMove(displayedProjects, activeIndex, overIndex);
      setOptimisticProjects(reordered);
      const newPosition = reordered.findIndex((p) => p.id === active.id);
      await moveProject(active.id as string, newPosition);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No projects yet.</p>
        <p className="text-muted-foreground mt-1">Create your first project to get started.</p>
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
        items={displayedProjects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {displayedProjects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeProject ? <ProjectRow project={activeProject} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
