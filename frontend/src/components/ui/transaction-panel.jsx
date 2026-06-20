import * as React from "react"
import { createPortal } from "react-dom"
import { X, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { getTransactions } from "@/api/client"

const fmt = (n) => `$${Math.abs(Number(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d) => {
  const [y, m, day] = d.split("-")
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TransactionPanel({ open, onClose, title, filters, color }) {
  const [transactions, setTransactions] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  React.useEffect(() => {
    if (!open || !filters) return
    setLoading(true)
    getTransactions({ ...filters, is_pending: 0 })
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [open, filters])

  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)
  const avg = transactions.length > 0 ? total / transactions.length : 0

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md border-l bg-background shadow-2xl",
        "flex flex-col",
        "transition-transform duration-300 ease-out",
        visible ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {color && (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              )}
              <h3 className="font-semibold text-base">{title}</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {filters && (filters.start_date || filters.end_date) && (
            <p className="text-xs text-muted-foreground mt-1 ml-0.5">
              {filters.start_date && filters.end_date
                ? `${fmtDate(filters.start_date)} — ${fmtDate(filters.end_date)}`
                : filters.start_date
                  ? `From ${fmtDate(filters.start_date)}`
                  : `Until ${fmtDate(filters.end_date)}`
              }
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-2">
                  <div className="h-4 w-14 rounded bg-muted animate-pulse shrink-0" />
                  <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${40 + (i * 7) % 40}%` }} />
                  <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto shrink-0" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Receipt className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((t, i) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50",
                    i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  )}
                >
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {fmtDate(t.date)}
                  </span>
                  <span className="text-sm truncate flex-1" title={t.description}>
                    {t.description}
                  </span>
                  <span className={cn(
                    "text-sm font-medium tabular-nums shrink-0",
                    t.amount < 0 ? "text-green-600" : ""
                  )}>
                    {t.amount < 0 ? `-${fmt(t.amount)}` : fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && transactions.length > 0 && (
          <div className="border-t bg-muted/30 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Avg {fmt(avg)} / txn
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold tabular-nums">{fmt(total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
