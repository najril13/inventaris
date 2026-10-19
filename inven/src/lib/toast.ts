"use client";

import { ToastQueue } from "@heroui/react";

export const toastQueue = new ToastQueue({ maxVisibleToasts: 3 });

export const toast = {
  success: (title: string, description?: string) => {
    toastQueue.add({
      title,
      description,
      variant: "success",
    });
  },
  error: (title: string, description?: string) => {
    toastQueue.add({
      title,
      description,
      variant: "danger",
    });
  },
  warning: (title: string, description?: string) => {
    toastQueue.add({
      title,
      description,
      variant: "warning",
    });
  },
  info: (title: string, description?: string) => {
    toastQueue.add({
      title,
      description,
      variant: "default",
    });
  },
};
