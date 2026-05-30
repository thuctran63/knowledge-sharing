"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseOptimisticToggleOptions<T> {
  initial: T;
  getNext: (current: T) => T;
  persist: (current: T, next: T) => Promise<T>;
  onError?: (error: unknown) => void;
  errorMessage?: string;
}

export function useOptimisticToggle<T>({
  initial,
  getNext,
  persist,
  onError,
  errorMessage = "Something went wrong. Please try again.",
}: UseOptimisticToggleOptions<T>) {
  const [state, setState] = useState(initial);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const toggle = useCallback(async () => {
    if (isPending) return;

    const previous = state;
    const optimistic = getNext(state);
    setState(optimistic);
    setIsPending(true);

    try {
      const confirmed = await persist(previous, optimistic);
      setState(confirmed);
    } catch (error) {
      setState(previous);
      onError?.(error);
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  }, [isPending, state, getNext, persist, onError, errorMessage, toast]);

  return { state, setState, toggle, isPending };
}
