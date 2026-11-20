import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { DEFAULT_TOAST_DURATIONS, ToastContext } from "./ToastContext";
import type { ShowToastOptions, ToastAction, ToastDurations, ToastTone } from "./ToastContext";
import styles from "./Toast.module.scss";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  onTimeout?: () => void;
}

interface TimerEntry {
  timeoutId: number;
  startedAt: number;
  remaining: number;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Test-only override - production never passes this, so the real 3000/6000ms
   * durations are unaffected. Lets tests use real timers with a short wait
   * instead of fake timers (which hang indefinitely with userEvent here). */
  durationMs?: Partial<ToastDurations>;
}

export function ToastProvider({ children, durationMs }: ToastProviderProps) {
  const durations: ToastDurations = { ...DEFAULT_TOAST_DURATIONS, ...durationMs };
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, TimerEntry>>(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((id: string, viaTimeout: boolean) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer.timeoutId);
      timers.current.delete(id);
    }
    setToasts((current) => {
      if (viaTimeout) current.find((toast) => toast.id === id)?.onTimeout?.();
      return current.filter((toast) => toast.id !== id);
    });
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      const timeoutId = window.setTimeout(() => dismiss(id, true), duration);
      timers.current.set(id, { timeoutId, startedAt: Date.now(), remaining: duration });
    },
    [dismiss],
  );

  const pause = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (!timer) return;
    window.clearTimeout(timer.timeoutId);
    const remaining = Math.max(timer.remaining - (Date.now() - timer.startedAt), 0);
    timers.current.set(id, { ...timer, remaining });
  }, []);

  const resume = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (!timer) return;
      const timeoutId = window.setTimeout(() => dismiss(id, true), timer.remaining);
      timers.current.set(id, { timeoutId, startedAt: Date.now(), remaining: timer.remaining });
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, options: ShowToastOptions = {}) => {
      const id = String(idRef.current++);
      const duration = options.action ? durations.withAction : durations.default;
      setToasts((current) => [
        ...current,
        {
          id,
          message,
          tone: options.tone ?? "info",
          action: options.action,
          onTimeout: options.onTimeout,
        },
      ]);
      scheduleDismiss(id, duration);
    },
    [scheduleDismiss, durations.default, durations.withAction],
  );

  // A background tab can throttle or freeze setTimeout, so hiding the tab
  // flushes every pending toast's onTimeout immediately rather than risking
  // it never firing (or firing much later) - see design.md's Toast spec.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      for (const id of Array.from(timers.current.keys())) dismiss(id, true);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [dismiss]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={clsx(styles.toast, styles[toast.tone])}
            onMouseEnter={() => pause(toast.id)}
            onMouseLeave={() => resume(toast.id)}
            onFocus={() => pause(toast.id)}
            onBlur={() => resume(toast.id)}
          >
            <span className={styles.message}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id, false);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
