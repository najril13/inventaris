"use client";

import { AlertDialog, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Hapus",
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && onCancel()}
      >
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="bg-[#181919] border border-zinc-800">
            <AlertDialog.Header>
              <AlertDialog.Icon className="bg-red-500/10 text-red-400">
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
                className="h-10 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
              >
                {isLoading ? "Menghapus..." : confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
