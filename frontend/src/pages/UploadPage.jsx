import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, CheckCircle, XCircle, Loader2, FileText, X, History, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getUploads, deleteUpload } from "@/api/client"
import { AlertDialog } from "@/components/ui/alert-dialog"

export default function UploadPage({ uploadQueue }) {
  const [isDragging, setIsDragging] = useState(false)
  const [pastUploads, setPastUploads] = useState([])
  const [uploadsLoading, setUploadsLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { files, handleFiles, clearFinished, completedUploadsVersion } = uploadQueue

  const fetchUploads = useCallback(async () => {
    try {
      const data = await getUploads()
      setPastUploads(data)
    } finally {
      setUploadsLoading(false)
    }
  }, [])

  useEffect(() => { fetchUploads() }, [fetchUploads, completedUploadsVersion])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const hasSuccess = files.some(f => f.status === "success")
  const hasFinished = files.some(f => f.status === "success" || f.status === "error")

  const handleDeleteUpload = (upload) => {
    setConfirmDialog({
      title: "Delete upload",
      description: `This will remove "${upload.filename}" and delete all its pending transactions. Committed transactions will not be affected.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          const result = await deleteUpload(upload.id)
          toast.success(`Deleted ${result.deleted_transactions} pending transaction${result.deleted_transactions !== 1 ? "s" : ""}`)
          fetchUploads()
        } catch {
          toast.error("Failed to delete upload")
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Statements</h2>
        <p className="text-muted-foreground">
          Drop the statement, we'll parse the payment.
        </p>
      </div>

      <Card
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Upload className={`h-12 w-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <CardTitle className="text-lg mb-2">
            {isDragging ? "Drop PDF here" : "Drop PDF statements here"}
          </CardTitle>
          <CardDescription>or click to browse</CardDescription>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Uploaded Files</CardTitle>
            {hasFinished && (
              <Button variant="ghost" size="sm" onClick={clearFinished}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{f.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === "pending" && (
                    <span className="text-xs text-muted-foreground">Waiting...</span>
                  )}
                  {f.status === "uploading" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Parsing...
                    </span>
                  )}
                  {f.status === "success" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {f.message}
                    </span>
                  )}
                  {f.status === "error" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5" />
                      {f.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasSuccess && (
        <div className="flex justify-end">
          <Button onClick={() => navigate("/review")}>
            Go to Review
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Past Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : pastUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No statements uploaded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastUploads.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          {u.filename}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {u.account_name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.statement_period
                          ? new Date(u.statement_period + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.uploaded_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteUpload(u)}
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
    </div>
  )
}
