import { Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Statements</h2>
        <p className="text-muted-foreground">
          Upload your bank or credit card PDF statements to parse transactions.
        </p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">Drop PDF statements here</CardTitle>
          <CardDescription>
            or click to browse. Supports all configured bank formats.
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>Previously uploaded statements will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No statements uploaded yet.</p>
        </CardContent>
      </Card>
    </div>
  )
}
