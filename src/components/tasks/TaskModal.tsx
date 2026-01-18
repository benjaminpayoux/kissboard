"use client";

import { useState, useCallback } from "react";
import { Trash2, Upload, X, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTasks, useTaskImages } from "@/lib/db/hooks";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { compressImage, validateImage } from "@/lib/utils/image";
import type { Task } from "@/lib/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task;
  mode: "create" | "edit";
  onSubmit?: (title: string) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  projectId,
  task,
  mode,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { updateTask, deleteTask } = useTasks(projectId);
  const { images, addImage, deleteImage } = useTaskImages(task?.id ?? "");

  const handleImageAdd = useCallback(
    async (file: File) => {
      if (!task) return;

      const validation = validateImage(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      try {
        const compressedBlob = await compressImage(file);
        await addImage(compressedBlob, file.name, file.type);
      } catch (error) {
        console.error("Failed to add image:", error);
        alert("Failed to add image. Please try again.");
      }
    },
    [task, addImage]
  );

  useClipboardPaste(handleImageAdd, isOpen && mode === "edit");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await handleImageAdd(file);
    }

    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    try {
      if (mode === "create" && onSubmit) {
        onSubmit(title.trim());
      } else if (mode === "edit" && task) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
        });
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || isLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this task? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await deleteTask(task.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    onClose();
  };

  const getImageUrl = (blob: Blob) => {
    return URL.createObjectURL(blob);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === "create" ? "New Task" : "Edit Task"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-200"
              autoFocus
              required
            />
          </div>

          {mode === "edit" && (
            <>
              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors duration-200 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Images</label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200">
                      <Upload className="w-4 h-4" />
                      Upload
                    </span>
                  </label>
                </div>

                {images && images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(getImageUrl(image.data))}
                          className="w-full aspect-square rounded-lg overflow-hidden border border-border hover:border-accent/20 transition-colors duration-200"
                        >
                          <img
                            src={getImageUrl(image.data)}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Delete image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Paste or upload images
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            {mode === "edit" && task && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
            <div className={`flex gap-3 ${mode === "create" ? "ml-auto" : ""}`}>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || isLoading}>
                {isLoading ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size image"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
