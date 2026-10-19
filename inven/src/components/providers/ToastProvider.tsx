"use client";

import React from "react";
import { Toast } from "@heroui/react";
import { toastQueue } from "@/src/lib/toast";

export function ToastProvider() {
  return <Toast.Provider placement="top end" queue={toastQueue} />;
}
