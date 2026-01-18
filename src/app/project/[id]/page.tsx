"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { useProject, useProjects } from "@/lib/db/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: PageProps) {
  const { id } = use(params);
  const project = useProject(id);
  const { deleteProject } = useProjects();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? All tasks and images will be permanently removed."
    );
    if (!confirmed) return;

    await deleteProject(id);
    router.push("/projects");
  };

  if (project === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (project === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted">Project not found</p>
        <Link href="/projects">
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-muted hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <Button variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Delete Project
          </Button>
        </div>

        <Board projectId={id} />
      </div>
    </main>
  );
}
