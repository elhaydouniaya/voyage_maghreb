"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast, { type ToastType } from "@/components/ui/Toast";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type AppNotifyContextValue = {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const AppNotifyContext = createContext<AppNotifyContextValue | null>(null);

export function AppNotifyProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [dialog, setDialog] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    setToastState({ message, type });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ options, resolve });
    });
  }, []);

  const closeDialog = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <AppNotifyContext.Provider value={{ toast, confirm }}>
      {children}
      {toastState && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={() => setToastState(null)}
        />
      )}
      {dialog && (
        <ConfirmDialog
          open
          title={dialog.options.title}
          message={dialog.options.message}
          confirmLabel={dialog.options.confirmLabel}
          cancelLabel={dialog.options.cancelLabel}
          variant={dialog.options.variant}
          onConfirm={() => closeDialog(true)}
          onCancel={() => closeDialog(false)}
        />
      )}
    </AppNotifyContext.Provider>
  );
}

export function useAppNotify() {
  const ctx = useContext(AppNotifyContext);
  if (!ctx) {
    throw new Error("useAppNotify must be used within AppNotifyProvider");
  }
  return ctx;
}
