import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastItem, ToastKind } from '../types';

const DEFAULT_TTL = 2600;
const MAX_VISIBLE = 3;

/**
 * Lightweight transient-notification queue.
 * Timers are tracked so unmounting never leaves a dangling setTimeout.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = 'info', ttl: number = DEFAULT_TTL) => {
      const id = ++idRef.current;
      setToasts((prev) => {
        const next = [...prev, { id, kind, message }];
        // Drop the oldest entries beyond the visible cap.
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });

      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, ttl);
      timersRef.current.set(id, timer);

      return id;
    },
    []
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { toasts, push, dismiss };
}
