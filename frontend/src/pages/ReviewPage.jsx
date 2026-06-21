import { useState, useEffect, useCallback } from "react"
import { FileEdit, Trash2, Search, Check, Save, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { KeywordDialog } from "@/components/ui/keyword-dialog"
import { AddTransactionDialog } from "@/components/ui/add-transaction-dialog"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  commitTransactions, getCategories, getAccounts, addCategoryKeyword,
} from "@/api/client"

export default function ReviewPage() {
  const [mode, setMode] = useState("pending")
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [editedRows, setEditedRows] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [keywordDialog, setKeywordDialog] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [search, setSearch] = useState("")
  const [accountFilter, setAccountFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { is_pending: mode === "pending" ? 1 : 0 }
      if (mode === "history" && search) params.search = search
      if (mode === "history" && accountFilter) params.account_id = accountFilter
      if (mode === "history" && monthFilter) {
        params.start_date = `${monthFilter}-01`
        const [y, m] = monthFilter.split("-").map(Number)
        const lastDay = new Date(y, m, 0).getDate()
        params.end_date = `${monthFilter}-${String(lastDay).padStart(2, "0")}`
      }
      const [txns, cats, accts] = await Promise.all([
        getTransactions(params),
        getCategories(),
        getAccounts(),
      ])
      setTransactions(txns)
      setCategories(cats)
      setAccounts(accts)
      setSelected(new Set())
      setEditedRows({})
      const origMap = {}
      for (const t of txns) {
        origMap[t.id] = { date: t.date, description: t.description, amount: t.amount, category_id: t.category_id }
      }
      setOriginalData(origMap)
    } finally {
      setLoading(false)
    }
  }, [mode, search, accountFilter, monthFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const updateEdited = (id, field, value) => {
    setEditedRows(prev => {
      const updated = { ...prev, [id]: { ...prev[id], [field]: value } }
      const orig = originalData[id]
      if (orig) {
        const edits = updated[id]
        const allMatch = Object.entries(edits).every(([k, v]) => {
          const origVal = orig[k]
          return origVal !== undefined && String(v) === String(origVal)
        })
        if (allMatch) {
          const { [id]: _, ...rest } = updated
          return rest
        }
      }
      return updated
    })
  }

  const handleEdit = (id, field, value) => {
    updateEdited(id, field, value)
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const handleCategoryChange = (id, categoryId) => {
    const cat = categories.find(c => c.id === Number(categoryId))
    const catName = cat?.name || null
    updateEdited(id, "category_id", Number(categoryId))
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, category_id: Number(categoryId), category_name: catName } : t
    ))

    const orig = originalData[id]
    const txn = transactions.find(t => t.id === id)
    if (catName && Number(categoryId) !== orig?.category_id && txn) {
      setKeywordDialog({ description: txn.description, categoryName: catName })
    }
  }

  const handleAddKeyword = async (keyword) => {
    if (!keywordDialog) return
    try {
      await addCategoryKeyword(keywordDialog.categoryName, keyword)
      const cat = categories.find(c => c.name === keywordDialog.categoryName)
      if (cat) {
        const kw = keyword.replace(/\s+/g, "").toUpperCase()
        const matchedIds = []
        setTransactions(prev => prev.map(t => {
          if (t.category_id) return t
          const desc = t.description.replace(/\s+/g, "").toUpperCase()
          if (!desc.includes(kw)) return t
          matchedIds.push(t.id)
          return { ...t, category_id: cat.id, category_name: cat.name }
        }))
        if (matchedIds.length > 0) {
          setEditedRows(prev => {
            const updated = { ...prev }
            for (const id of matchedIds) {
              updated[id] = { ...updated[id], category_id: cat.id }
            }
            return updated
          })
          toast.success(`Added "${keyword}" to ${keywordDialog.categoryName} — applied to ${matchedIds.length} more transaction${matchedIds.length !== 1 ? "s" : ""}`)
        } else {
          toast.success(`Added "${keyword}" to ${keywordDialog.categoryName}`)
        }
      } else {
        toast.success(`Added "${keyword}" to ${keywordDialog.categoryName}`)
      }
    } catch {
      toast.error("Failed to add keyword")
    }
    setKeywordDialog(null)
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Delete transaction",
      description: "This transaction will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteTransaction(id)
          setTransactions(prev => prev.filter(t => t.id !== id))
          setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
          toast.success("Transaction deleted")
        } catch {
          toast.error("Failed to delete transaction")
        }
      },
    })
  }

  const saveEditsBeforeCommit = async () => {
    if (Object.keys(editedRows).length === 0) return
    const promises = Object.entries(editedRows).map(([id, fields]) =>
      updateTransaction(Number(id), fields)
    )
    await Promise.all(promises)
    setEditedRows({})
  }

  const handleCommitAll = () => {
    setConfirmDialog({
      title: "Commit all transactions",
      description: `This will commit all ${transactions.length} transactions to your database. You can still edit them later in Transaction History.`,
      confirmLabel: "Commit All",
      onConfirm: async () => {
        setConfirmDialog(null)
        setActionLoading("commitAll")
        try {
          await saveEditsBeforeCommit()
          const ids = transactions.map(t => t.id)
          await commitTransactions(ids)
          toast.success(`${ids.length} transactions committed`)
          fetchData()
        } catch {
          toast.error("Failed to commit transactions")
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handleCommitSelected = async () => {
    setActionLoading("commitSelected")
    try {
      const selectedEdits = Object.fromEntries(
        Object.entries(editedRows).filter(([id]) => selected.has(Number(id)))
      )
      if (Object.keys(selectedEdits).length > 0) {
        await Promise.all(
          Object.entries(selectedEdits).map(([id, fields]) =>
            updateTransaction(Number(id), fields)
          )
        )
        setEditedRows(prev => {
          const rest = { ...prev }
          for (const id of Object.keys(selectedEdits)) delete rest[id]
          return rest
        })
      }
      const count = selected.size
      await commitTransactions([...selected])
      toast.success(`${count} transaction${count !== 1 ? "s" : ""} committed`)
      fetchData()
    } catch {
      toast.error("Failed to commit transactions")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveChanges = async () => {
    setActionLoading("save")
    try {
      const promises = Object.entries(editedRows).map(([id, fields]) =>
        updateTransaction(Number(id), fields)
      )
      await Promise.all(promises)
      setEditedRows({})
      toast.success("Changes saved")
      fetchData()
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddTransaction = async (data) => {
    try {
      await createTransaction(data)
      toast.success("Transaction added")
      setShowAddDialog(false)
      if (mode === "history") {
        fetchData()
      } else {
        setMode("history")
      }
    } catch {
      toast.error("Failed to add transaction")
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map(t => t.id)))
    }
  }

  const hasEdits = Object.keys(editedRows).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Edit</h2>
        <p className="text-muted-foreground">
          Review, tweak, commit — your transactions, your rules.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={mode === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("pending")}
        >
          Pending Review
        </Button>
        <Button
          variant={mode === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("history")}
        >
          Transaction History
        </Button>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {mode === "history" && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="w-40"
          />
          <Select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">
            {mode === "pending"
              ? `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} pending review`
              : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
          </CardTitle>
          <div className="flex gap-2">
            {mode === "pending" && transactions.length > 0 && (
              <>
                {selected.size > 0 && (
                  <Button size="sm" variant="outline" onClick={handleCommitSelected} disabled={!!actionLoading}>
                    {actionLoading === "commitSelected" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Commit Selected ({selected.size})
                  </Button>
                )}
                <Button size="sm" onClick={handleCommitAll} disabled={!!actionLoading}>
                  {actionLoading === "commitAll" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Commit All
                </Button>
              </>
            )}
            {mode === "history" && hasEdits && (
              <Button size="sm" onClick={handleSaveChanges} disabled={!!actionLoading}>
                {actionLoading === "save" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes ({Object.keys(editedRows).length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileEdit className="h-10 w-10 mb-3" />
              <p className="text-sm">
                {mode === "pending"
                  ? "No pending transactions. Upload a statement to get started."
                  : "No transactions found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === transactions.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-28 text-right">Amount</TableHead>
                  <TableHead className="w-40">Category</TableHead>
                  <TableHead className="w-36">Account</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id} data-state={selected.has(t.id) ? "selected" : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={t.date}
                        onChange={e => handleEdit(t.id, "date", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={t.description}
                        onChange={e => handleEdit(t.id, "description", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={t.amount}
                        onChange={e => handleEdit(t.id, "amount", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.category_id || ""}
                        onChange={e => handleCategoryChange(t.id, e.target.value)}
                        className="h-8 text-xs"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {t.account_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
      />

      <KeywordDialog
        open={!!keywordDialog}
        onClose={() => setKeywordDialog(null)}
        description={keywordDialog?.description || ""}
        categoryName={keywordDialog?.categoryName || ""}
        onAdd={handleAddKeyword}
      />

      <AddTransactionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddTransaction}
        categories={categories}
        accounts={accounts}
      />
    </div>
  )
}
