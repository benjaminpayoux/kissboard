"use client";

import { useState, useEffect } from "react";

export function useStorageAvailability() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        if (!window.indexedDB) {
          setIsAvailable(false);
          return;
        }

        const testDbName = "__kissboard_test__";
        const request = window.indexedDB.open(testDbName);

        await new Promise<void>((resolve, reject) => {
          request.onerror = () => reject(new Error("IndexedDB not available"));
          request.onsuccess = () => {
            request.result.close();
            window.indexedDB.deleteDatabase(testDbName);
            resolve();
          };
        });

        setIsAvailable(true);
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  return isAvailable;
}
