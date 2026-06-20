import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

function splitTokens(description) {
  const spaceTokens = description.split(/\s+/).filter(Boolean)
  const result = []
  for (const word of spaceTokens) {
    const parts = word.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=\D)(?=\d)|(?<=\d)(?=\D)/)
    for (const part of parts) {
      if (part) result.push(part)
    }
  }
  return result
}

export function KeywordDialog({ open, onClose, description, categoryName, onAdd }) {
  const [selectedTokens, setSelectedTokens] = React.useState(new Set())
  const [customKeyword, setCustomKeyword] = React.useState("")
  const [useCustom, setUseCustom] = React.useState(false)

  const tokens = React.useMemo(() => splitTokens(description || ""), [description])

  React.useEffect(() => {
    if (open) {
      setSelectedTokens(new Set())
      setCustomKeyword("")
      setUseCustom(false)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  const toggleToken = (index) => {
    setSelectedTokens(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
    setUseCustom(false)
  }

  const assembledKeyword = (useCustom
    ? customKeyword.trim()
    : tokens.filter((_, i) => selectedTokens.has(i)).join("")
  ).toUpperCase()

  const canAdd = assembledKeyword.length > 0

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
        "animate-in fade-in-0 zoom-in-95"
      )}>
        <h3 className="text-lg font-semibold">Add keyword rule</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a keyword to <span className="font-medium text-foreground">{categoryName}</span> so
          similar transactions are auto-categorized in future uploads.
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Select parts of the description:</p>
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((token, i) => (
              <button
                key={i}
                onClick={() => toggleToken(i)}
                className={cn(
                  "px-2 py-1 rounded-md text-sm border transition-colors",
                  selectedTokens.has(i) && !useCustom
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:bg-muted"
                )}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Or type a custom keyword:</p>
          <Input
            value={customKeyword}
            onChange={e => {
              setCustomKeyword(e.target.value)
              setUseCustom(true)
              setSelectedTokens(new Set())
            }}
            placeholder="Type keyword..."
            className="h-8 text-sm"
          />
        </div>

        {assembledKeyword && (
          <div className="mt-4 p-3 rounded-md bg-muted/50 border">
            <p className="text-xs text-muted-foreground">Keyword to add:</p>
            <p className="text-sm font-mono font-medium mt-0.5">{assembledKeyword}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>Skip</Button>
          <Button size="sm" onClick={() => onAdd(assembledKeyword)} disabled={!canAdd}>
            Add Keyword
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
