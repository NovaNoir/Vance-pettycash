"use client"

import type * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ButtonVariant = "default" | "destructive" | "secondary" | "outline" | "ghost" | "link"

interface ConfirmDialogProps {
  /* Dialog open state */
  isOpen: boolean
  /* Fired when the user closes the dialog by any means other than “Confirm” */
  onClose: () => void
  /* Fired when the user clicks the confirm button */
  onConfirm: () => void
  /* Dialog title text */
  title: string
  /* Extra content below the title. Accepts rich JSX. */
  description?: React.ReactNode
  /* Confirm-button label (default “Confirm”) */
  confirmText?: string
  /* Cancel-button label (default “Cancel”) */
  cancelText?: string
  /* shadcn/ui button variant for the confirm button */
  variant?: ButtonVariant
  /* Show a spinner / disable buttons while async work is happening */
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          {description &&
            (typeof description === "string" ? (
              /* Plain string – safe to let DialogDescription render the default <p> */
              <DialogDescription>{description}</DialogDescription>
            ) : (
              /* Rich JSX – avoid <p>-inside-<p> by using asChild */
              <DialogDescription asChild>
                {/* MUST be single element */}
                <div>{description}</div>
              </DialogDescription>
            ))}
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Please wait…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
