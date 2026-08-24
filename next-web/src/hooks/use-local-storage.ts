"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) setValue(JSON.parse(raw) as T);
      } catch { /* keep initial value */ }
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, [key]);

  const update = useCallback((next: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = typeof next === "function" ? (next as (value: T) => T)(current) : next;
      try { window.localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* storage may be unavailable */ }
      return resolved;
    });
  }, [key]);

  return [value, update] as const;
}
