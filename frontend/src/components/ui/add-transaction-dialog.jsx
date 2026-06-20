import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Select } from "./select"

export function AddTransactionDialog({ open, onClose, onAdd, categories, accounts }) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = React.useState({ date: today, description: "", amount: "", category_id: "", account_id: "" })
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setForm({ date: today, description: "", amount: "", category_id: "", account_id: accounts[0]?.id || "" })
      setSubmitting(false)
    }
  }, [open, today, accounts])

  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const canSubmit = form.date && form.description.trim() && form.amount && form.account_id && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onAdd({
        date: form.date,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        category_id: form.category_id ? Number(form.category_id) : null,
        account_id: Number(form.account_id),
        is_pending: 0,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        "relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg",
        "animate-in fade-in-0 zoom-in-95"
      )}>
        <h3 className="text-lg font-semibold">Add Transaction</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Manually add a transaction. It will be committed directly.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={e => update("date", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={e => update("amount", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <Input
              placeholder="e.g. Lunch at hawker centre"
              value={form.description}
              onChange={e => update("description", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account</label>
              <Select
                value={form.account_id}
                onChange={e => update("account_id", e.target.value)}
                required
              >
                <option value="">Select account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
              <Select
                value={form.category_id}
                onChange={e => update("category_id", e.target.value)}
              >
                <option value="">Uncategorized</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {submitting ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
