"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/lib/db/hooks";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createProject } = useProjects();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const project = await createProject(name.trim());
      setName("");
      onClose();
      router.push(`/project/${project.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="project-name"
            className="block text-sm font-medium mb-2"
          >
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-200"
            autoFocus
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
