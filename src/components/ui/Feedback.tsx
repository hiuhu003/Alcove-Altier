"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-site toasts and confirmation dialogs, replacing the browser's native
 * alert()/confirm().
 *
 * The native ones announce the domain ("alcove-altier.vercel.app says…"), can't
 * be styled, block the whole tab, and look like a scam warning on a boutique
 * storefront. These match the brand, animate, and — importantly for the admin —
 * let a destructive action name what it is about to delete.
 */

// --- Types -------------------------------------------------------------------

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
  /** Optional second line, e.g. what exactly was saved. */
  detail?: string;
};

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button in the warning colour. */
  tone?: "danger" | "default";
};

type FeedbackApi = {
  toast: {
    success: (message: string, detail?: string) => void;
    error: (message: string, detail?: string) => void;
    info: (message: string, detail?: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

/**
 * Access toasts and confirmations. Safe to call from any client component
 * under <FeedbackProvider> (mounted in the root layout).
 */
export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used inside <FeedbackProvider>");
  }
  return ctx;
}

// --- Provider ----------------------------------------------------------------

const TOAST_MS = 4200;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, detail?: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, tone, message, detail }]);
      // Errors linger — the reader probably needs to act on them.
      const life = tone === "error" ? TOAST_MS * 2 : TOAST_MS;
      setTimeout(() => dismiss(id), life);
    },
    [dismiss]
  );

  const api = useMemo<FeedbackApi>(
    () => ({
      toast: {
        success: (m, d) => push("success", m, d),
        error: (m, d) => push("error", m, d),
        info: (m, d) => push("info", m, d),
      },
      confirm: (options) =>
        new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    }),
    [push]
  );

  const closeConfirm = useCallback(
    (ok: boolean) => {
      setConfirmState((current) => {
        current?.resolve(ok);
        return null;
      });
    },
    []
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />
    </FeedbackContext.Provider>
  );
}

// --- Toasts ------------------------------------------------------------------

const toneStyles: Record<ToastTone, { icon: typeof Check; className: string }> = {
  success: { icon: Check, className: "border-emerald-600/25 bg-emerald-50 text-emerald-900" },
  error: { icon: AlertTriangle, className: "border-coral/40 bg-coral-50 text-charcoal" },
  info: { icon: Info, className: "border-charcoal/15 bg-cream text-charcoal" },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      // aria-live so screen readers announce these the way alert() used to.
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end sm:p-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, className } = toneStyles[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-charcoal/5",
                className
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium leading-snug">{t.message}</p>
                {t.detail && <p className="mt-0.5 text-xs opacity-80">{t.detail}</p>}
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss"
                className="-mr-1 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// --- Confirm dialog ----------------------------------------------------------

function ConfirmDialog({
  state,
  onClose,
}: {
  state: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  onClose: (ok: boolean) => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Escape cancels, and focus lands on the confirm button — the same keyboard
  // contract people already have with the native dialog.
  useEffect(() => {
    if (!state) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  const danger = state?.tone === "danger";

  return (
    <AnimatePresence>
      {state && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
            className="fixed inset-0 z-[130] bg-charcoal/50 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed left-1/2 top-1/2 z-[140] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-charcoal/10 bg-cream p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                  danger ? "bg-coral/15 text-coral" : "bg-blush/40 text-charcoal"
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="font-serif text-2xl leading-tight">
                  {state.title}
                </h2>
                {state.body && (
                  <p className="mt-2 text-sm leading-relaxed text-graphite">{state.body}</p>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => onClose(false)}
                className="h-11 rounded-full border border-charcoal/20 px-5 text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
              >
                {state.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmRef}
                onClick={() => onClose(true)}
                className={cn(
                  "h-11 rounded-full px-5 text-sm font-medium text-white transition-colors",
                  danger ? "bg-coral hover:bg-charcoal" : "bg-pink-strong hover:bg-charcoal"
                )}
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Small inline spinner for buttons that are mid-request. */
export function ButtonSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
