"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useStorageAvailability } from "@/hooks/useStorageAvailability";

export function StorageBanner() {
  const isAvailable = useStorageAvailability();
  const [dismissed, setDismissed] = useState(false);

  if (isAvailable === null || isAvailable || dismissed) return null;

  return (
    <div className="bg-warning-bg border-b border-warning-text/20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-text flex-shrink-0" />
          <p className="text-sm text-warning-text">
            Local storage is unavailable. Your data will not persist between
            sessions. This may occur in private browsing mode.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-warning-text hover:text-warning-text/80 transition-colors duration-200"
          aria-label="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
