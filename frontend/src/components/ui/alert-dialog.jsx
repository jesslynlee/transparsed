import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export function AlertDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", variant = "default" }) {
  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        "relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg",
        "animate-in fade-in-0 zoom-in-95"
      )}>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
