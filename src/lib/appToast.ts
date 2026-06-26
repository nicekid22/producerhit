/**
 * Contrat UX toasts ProducerHit :
 * - Toasts : auto-dismiss sauf loading / persistent
 * - Modales (PlanUpsell, LootReveal, ShareMoment) : fermeture utilisateur
 * - Bannières inline (CheckoutRecovery) : dismiss explicite, pas d’auto-hide
 */
import toast, { type Toast, type ToastOptions } from "react-hot-toast";
import type { ReactElement } from "react";

export const TOAST_DURATIONS = {
  short: 2500,
  default: 4200,
  info: 4500,
  important: 5000,
  notice: 8000,
  persistent: Infinity,
} as const;

type ToastOpts = ToastOptions;

export function toastSuccess(message: string, opts?: ToastOpts): string {
  return toast.success(message, { duration: TOAST_DURATIONS.default, ...opts });
}

export function toastError(message: string, opts?: ToastOpts): string {
  return toast.error(message, { duration: TOAST_DURATIONS.default, ...opts });
}

export function toastInfo(message: string, opts?: ToastOpts): string {
  return toast(message, { duration: TOAST_DURATIONS.info, ...opts });
}

export function toastImportant(message: string, opts?: ToastOpts): string {
  return toast(message, { duration: TOAST_DURATIONS.important, ...opts });
}

export function toastShort(message: string, opts?: ToastOpts): string {
  return toast(message, { duration: TOAST_DURATIONS.short, ...opts });
}

export function toastLoading(message: string, opts?: ToastOpts): string {
  return toast.loading(message, { duration: TOAST_DURATIONS.persistent, ...opts });
}

export function toastNotice(
  message: string,
  render: (t: Toast) => ReactElement,
  opts?: ToastOpts,
): string {
  return toast.custom(render, { duration: TOAST_DURATIONS.notice, ...opts });
}

export { toast };
