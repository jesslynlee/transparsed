import { useCallback, useMemo, useRef, useState } from "react"
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom"
import { Upload, FileEdit, LayoutDashboard, Settings } from "lucide-react"
import { Toaster, toast } from "sonner"
import { uploadStatement } from "@/api/client"
import UploadPage from "@/pages/UploadPage"
import ReviewPage from "@/pages/ReviewPage"
import DashboardPage from "@/pages/DashboardPage"
import SettingsPage from "@/pages/SettingsPage"

const navItems = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/review", label: "Review & Edit", icon: FileEdit },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/settings", label: "Settings", icon: Settings },
]

function useUploadQueue() {
  const [files, setFiles] = useState([])
  const [completedUploadsVersion, setCompletedUploadsVersion] = useState(0)
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
        toast.success(`${result.transaction_count} transactions parsed from ${entry.name}`)
        setCompletedUploadsVersion(version => version + 1)
      } catch (err) {
        const message = err.response?.data?.error || "Upload failed"
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: "error", message } : f
        ))
        toast.error(`${entry.name}: ${message}`)
      }
    }
  }, [])

  const clearFinished = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== "success" && f.status !== "error"))
  }, [])

  return useMemo(() => ({
    files,
    handleFiles,
    clearFinished,
    completedUploadsVersion,
  }), [files, handleFiles, clearFinished, completedUploadsVersion])
}

export default function App() {
  const uploadQueue = useUploadQueue()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 flex h-14 items-center gap-8">
            <h1 className="text-lg font-semibold tracking-tight">TransParsed</h1>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<UploadPage uploadQueue={uploadQueue} />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
        <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  )
}
