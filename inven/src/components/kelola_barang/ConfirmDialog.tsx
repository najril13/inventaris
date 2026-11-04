"use client";

import { AlertDialog, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmVariant?: "danger" | "warning" | "success";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Hapus",
  loadingLabel,
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  const iconColors =
    confirmVariant === "warning"
      ? "bg-amber-500/10 text-amber-400"
      : confirmVariant === "success"
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-red-500/10 text-red-400";

  const buttonColors =
    confirmVariant === "warning"
      ? "bg-amber-500 hover:bg-amber-400 text-black font-semibold"
      : confirmVariant === "success"
      ? "bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
      : "bg-red-500 hover:bg-red-400 text-white font-semibold";

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && onCancel()}
      >
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="bg-[#181919] border border-zinc-800">
            <AlertDialog.Header>
              <AlertDialog.Icon className={iconColors}>
                <AlertTriangle size={20} />
              </AlertDialog.Icon>
              <AlertDialog.Heading className="text-zinc-100">
                {title}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-sm text-zinc-400">
              {description}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button
                type="button"
                onPress={onCancel}
                isDisabled={isLoading}
                className="h-10 rounded-xl border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="button"
                onPress={onConfirm}
                isDisabled={isLoading}
                className={`h-10 rounded-xl px-4 text-sm disabled:opacity-50 ${buttonColors}`}
              >
                {isLoading ? (loadingLabel || "Memproses...") : confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
