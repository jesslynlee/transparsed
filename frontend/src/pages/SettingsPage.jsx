import { useState, useEffect, useCallback } from "react"
import { X, Plus, ChevronDown, Trash2, CreditCard, Landmark } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  getKeywordsWithIds, addCategoryKeyword, deleteCategoryKeyword,
  getCategories, createCategory, deleteCategory,
  getAccounts, createAccount, deleteAccount,
} from "@/api/client"

export default function SettingsPage() {
  const [keywords, setKeywords] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1")
  const [newAccount, setNewAccount] = useState({
    name: "",
    institution: "",
    type: "",
  })
  const [confirmDialog, setConfirmDialog] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [kws, cats, accts] = await Promise.all([
        getKeywordsWithIds(),
        getCategories(),
        getAccounts(),
      ])
      setKeywords(kws)
      setCategories(cats)
      setAccounts(accts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const grouped = categories
    .map(cat => ({
      ...cat,
      keywords: keywords.filter(k => k.category_id === cat.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleAddKeyword = async (cat) => {
    const value = (newKeyword[cat.id] || "").trim()
    if (!value) return
    try {
      await addCategoryKeyword(cat.name, value)
      setNewKeyword(prev => ({ ...prev, [cat.id]: "" }))
      toast.success(`Added "${value.toUpperCase()}" to ${cat.name}`)
      fetchData()
    } catch {
      toast.error("Failed to add keyword")
    }
  }

  const handleDeleteKeyword = async (kw) => {
    try {
      await deleteCategoryKeyword(kw.id)
      setKeywords(prev => prev.filter(k => k.id !== kw.id))
    } catch {
      toast.error("Failed to remove keyword")
    }
  }

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      await createCategory(name, newCategoryColor)
      setNewCategoryName("")
      setNewCategoryColor("#6366f1")
      toast.success(`Added category "${name}"`)
      fetchData()
    } catch {
      toast.error("Failed to add category")
    }
  }

  const buildTemplateId = (institution, name) => (
    `${institution} ${name}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  )

  const handleAddAccount = async () => {
    const name = newAccount.name.trim()
    const institution = newAccount.institution.trim()
    if (!name || !institution) return

    try {
      await createAccount({
        name,
        institution,
        type: newAccount.type,
        template_id: buildTemplateId(institution, name),
      })
      setNewAccount({ name: "", institution: "", type: "" })
      toast.success(`Added account "${name}"`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add account")
    }
  }

  const handleDeleteAccount = (acct) => {
    setConfirmDialog({
      title: `Delete "${acct.name}"`,
      description: "This removes the account from future statement matching. Existing transactions are not changed.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteAccount(acct.id)
          toast.success(`Deleted "${acct.name}"`)
          fetchData()
        } catch {
          toast.error("Failed to delete account")
        }
      },
    })
  }

  const handleDeleteCategory = (cat) => {
    setConfirmDialog({
      title: `Delete "${cat.name}"`,
      description: `This will remove the category and its ${cat.keywords.length} keyword${cat.keywords.length !== 1 ? "s" : ""}. Transactions in this category will become uncategorized.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await deleteCategory(cat.id)
          if (expanded === cat.id) setExpanded(null)
          toast.success(`Deleted "${cat.name}"`)
          fetchData()
        } catch {
          toast.error("Failed to delete category")
        }
      },
    })
  }

  const toggle = (catId) => setExpanded(prev => prev === catId ? null : catId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Define accounts and spending vocabulary.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            Accounts
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Institution"
              value={newAccount.institution}
              onChange={e => setNewAccount(prev => ({ ...prev, institution: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") handleAddAccount() }}
              className="h-8 text-xs w-36"
            />
            <Input
              placeholder="Account name"
              value={newAccount.name}
              onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") handleAddAccount() }}
              className="h-8 text-xs w-48"
            />
            <select
              value={newAccount.type}
              onChange={e => setNewAccount(prev => ({ ...prev, type: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">Type</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank">Bank</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleAddAccount}
              disabled={!newAccount.name.trim() || !newAccount.institution.trim() || !newAccount.type}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-9 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No accounts added yet.
            </p>
          ) : (
            <div className="divide-y">
              {accounts.map(acct => (
                <div key={acct.id} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded hover:bg-muted/50 transition-colors">
                  {acct.type === "bank" ? (
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{acct.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{acct.institution}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {acct.type === "credit_card" ? "Credit Card" : "Bank"}
                  </Badge>
                  <button
                    onClick={() => handleDeleteAccount(acct)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Categories</CardTitle>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={newCategoryColor}
              onChange={e => setNewCategoryColor(e.target.value)}
              className="h-7 w-7 rounded border cursor-pointer p-0.5"
            />
            <Input
              placeholder="New category..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddCategory() }}
              className="h-8 text-xs w-44"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {grouped.map(cat => {
                const isOpen = expanded === cat.id
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 py-2.5 -mx-2 px-2 rounded hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => toggle(cat.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium flex-1">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{cat.keywords.length}</span>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat) }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="pb-3 pl-5 space-y-2">
                        {cat.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {cat.keywords.map(kw => (
                              <Badge
                                key={kw.id}
                                variant="secondary"
                                className="text-xs font-normal pl-2 pr-1 py-0.5 gap-1"
                              >
                                {kw.keyword}
                                <button
                                  onClick={() => handleDeleteKeyword(kw)}
                                  className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add keyword..."
                            value={newKeyword[cat.id] || ""}
                            onChange={e => setNewKeyword(prev => ({ ...prev, [cat.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleAddKeyword(cat) }}
                            className="h-7 text-xs flex-1 max-w-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => handleAddKeyword(cat)}
                            disabled={!(newKeyword[cat.id] || "").trim()}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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
    </div>
  )
}
