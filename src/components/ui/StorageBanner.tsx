"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStorageAvailability } from "@/hooks/useStorageAvailability";

export function StorageBanner() {
  const isAvailable = useStorageAvailability();
  const [dismissed, setDismissed] = useState(false);

  if (isAvailable === null || isAvailable || dismissed) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-warning-bg border-warning-text/20">
      <AlertTriangle className="h-4 w-4 text-warning-text" />
      <AlertDescription className="flex items-center justify-between flex-1 text-warning-text">
        <span>
          Local storage is unavailable. Your data will not persist between
          sessions. This may occur in private browsing mode.
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-warning-text hover:text-warning-text/80 transition-colors duration-200"
          aria-label="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </AlertDescription>
    </Alert>
  );
}
