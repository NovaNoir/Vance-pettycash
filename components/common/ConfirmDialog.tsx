"use client"

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal"
import { LoadingSpinner } from "./LoadingSpinner"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "success" | "warning"
  isLoading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  destructive: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
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
  const config = variantConfig[variant]
  const Icon = config.icon

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive"
      case "success":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
          </div>
          <ModalTitle className="text-lg font-semibold">{title}</ModalTitle>
          <ModalDescription className="text-sm text-muted-foreground mt-2">{description}</ModalDescription>
        </ModalHeader>

        <ModalFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
