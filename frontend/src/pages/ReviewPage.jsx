import { FileEdit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Edit</h2>
        <p className="text-muted-foreground">
          Review parsed transactions, make corrections, and save to your database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Transactions parsed from your latest upload. Edit any field before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileEdit className="h-10 w-10 mb-3" />
            <p className="text-sm">No pending transactions. Upload a statement to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
