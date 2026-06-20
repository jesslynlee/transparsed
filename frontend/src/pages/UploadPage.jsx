import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, CheckCircle, XCircle, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadStatement } from "@/api/client"

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const nextId = useRef(0)

  const handleFiles = useCallback(async (newFiles) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.name.toLowerCase().endsWith(".pdf"))
    if (pdfFiles.length === 0) return

    const entries = pdfFiles.map(f => ({
      id: nextId.current++,
      file: f,
      name: f.name,
      status: "pending",
      message: null,
      transactionCount: null,
    }))

    setFiles(prev => [...prev, ...entries])

    for (const entry of entries) {
      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, status: "uploading" } : f
      ))

      try {
        const result = await uploadStatement(entry.file)
        setFiles(prev => prev.map(f =>
          f.id === entry.id
            ? { ...f, status: "success", message: result.message, transactionCount: result.transaction_count }
            : f
        ))
      } catch (err) {
        const message = err.response?.data?.error || "Upload failed"
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: "error", message } : f
        ))
      }
    }
  }, [])

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Statements</h2>
        <p className="text-muted-foreground">
          Upload your bank or credit card PDF statements to parse transactions.
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
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
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
    </div>
  )
}
