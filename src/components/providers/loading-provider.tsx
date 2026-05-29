"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

type LoadingContextValue = {
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const countRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, msg?: string): Promise<T> => {
      countRef.current += 1;
      if (countRef.current === 1) {
        setMessage(msg);
        setVisible(true);
      }

      try {
        return await fn();
      } finally {
        countRef.current = Math.max(0, countRef.current - 1);
        if (countRef.current === 0) {
          setVisible(false);
          setMessage(undefined);
        }
      }
    },
    []
  );

  return (
    <LoadingContext.Provider value={{ withLoading, isLoading: visible }}>
      {children}
      {visible && <LoadingOverlay message={message} />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}
