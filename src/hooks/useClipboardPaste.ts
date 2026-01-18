"use client";

import { useCallback, useRef, useEffect } from "react";

export function useClipboardPaste(
  onImagePaste: (file: File) => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(onImagePaste);
  callbackRef.current = onImagePaste;

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          callbackRef.current(file);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [enabled, handlePaste]);
}
