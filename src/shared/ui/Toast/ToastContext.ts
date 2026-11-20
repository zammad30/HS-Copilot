import { createContext } from "react";

export type ToastTone = "success" | "info" | "delete";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ShowToastOptions {
  tone?: ToastTone;
  action?: ToastAction;
  /** Called only when the toast dismisses by its own timer, never when the
   * action is clicked - lets a caller "flush" work (e.g. a deferred delete)
   * that the action would otherwise cancel. */
  onTimeout?: () => void;
}

export interface ToastContextValue {
  show: (message: string, options?: ShowToastOptions) => void;
}

/** Durations in ms. Production always uses the defaults (3000 / 6000); tests
 * may override both down to a few tens of ms to run with real timers instead
 * of fake ones. */
export interface ToastDurations {
  default: number;
  withAction: number;
}

export const DEFAULT_TOAST_DURATIONS: ToastDurations = { default: 3000, withAction: 6000 };

export const ToastContext = createContext<ToastContextValue>({ show: () => {} });
