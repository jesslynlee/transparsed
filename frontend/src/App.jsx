import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom"
import { Upload, FileEdit, LayoutDashboard } from "lucide-react"
import UploadPage from "@/pages/UploadPage"
import ReviewPage from "@/pages/ReviewPage"
import DashboardPage from "@/pages/DashboardPage"

const navItems = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/review", label: "Review & Edit", icon: FileEdit },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 flex h-14 items-center gap-8">
            <h1 className="text-lg font-semibold tracking-tight">Expense Tracker</h1>
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
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
