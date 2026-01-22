"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Trash2, Upload, X, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { db } from "@/lib/db";
import { useTasks, useTaskImages } from "@/lib/db/hooks";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { compressImage, validateImage } from "@/lib/utils/image";
import type { Task } from "@/lib/types";

interface PendingImage {
  id: string;
  file: File;
  preview: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task;
  mode: "create" | "edit";
  onSubmit?: (title: string, description: string) => Promise<string>;
  onDeleted?: (taskId: string) => void;
  onUpdated?: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  projectId,
  task,
  mode,
  onSubmit,
  onDeleted,
  onUpdated,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const { updateTask, deleteTask } = useTasks(projectId);
  const { images, addImage, deleteImage } = useTaskImages(task?.id ?? "");

  const handleImageAdd = useCallback(
    async (file: File) => {
      const validation = validateImage(file);
      if (!validation.valid) {
        setErrorMessage(validation.error ?? "Invalid image");
        return;
      }

      try {
        if (mode === "create") {
          const preview = URL.createObjectURL(file);
          setPendingImages((prev) => [...prev, { id: uuidv4(), file, preview }]);
        } else if (task) {
          const compressedBlob = await compressImage(file);
          await addImage(compressedBlob, file.name, file.type);
        }
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to add image:", error);
        setErrorMessage("Failed to add image. Please try again.");
      }
    },
    [mode, task, addImage]
  );

  useClipboardPaste(handleImageAdd, isOpen);

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
        const taskId = await onSubmit(title.trim(), description.trim());
        for (const pending of pendingImages) {
          const compressedBlob = await compressImage(pending.file);
          await db.images.add({
            id: uuidv4(),
            taskId,
            data: compressedBlob,
            name: pending.file.name,
            mimeType: pending.file.type,
            createdAt: new Date(),
          });
        }
        pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
        setPendingImages([]);
        setTitle("");
        setDescription("");
      } else if (mode === "edit" && task) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
        });
        onUpdated?.();
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!task || isLoading) return;

    setIsLoading(true);
    try {
      await deleteTask(task.id);
      onDeleted?.(task.id);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setErrorMessage(null);
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setPendingImages([]);
    onClose();
  };

  const handleDeletePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const getImageUrl = (blob: Blob) => {
    return URL.createObjectURL(blob);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Task" : "Edit Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Images</Label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                    <Upload className="w-4 h-4" />
                    Upload
                  </span>
                </label>
              </div>

              {mode === "create" ? (
                pendingImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {pendingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(image.preview)}
                          className="w-full aspect-square rounded-lg overflow-hidden border border-border hover:border-ring transition-colors duration-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.preview}
                            alt={image.file.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePendingImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Delete image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Paste or upload images</p>
                  </div>
                )
              ) : images && images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(getImageUrl(image.data))}
                        className="w-full aspect-square rounded-lg overflow-hidden border border-border hover:border-ring transition-colors duration-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(image.data)}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImage(image.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Delete image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Paste or upload images</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {mode === "edit" && task && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              <div className={`flex gap-3 ${mode === "create" ? "ml-auto" : ""}`}>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!title.trim() || isLoading}>
                  {isLoading ? "Saving..." : mode === "create" ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
