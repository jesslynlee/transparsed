import { useState, useEffect, useCallback } from "react"
import { BarChart3, TrendingUp, TrendingDown, Wallet, Search, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  getDashboardSummary, getDashboardByCategory, getDashboardTrends,
  getDashboardTopCategories, getDashboardTopMerchants,
  getAccounts, getCategories,
} from "@/api/client"

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [byCategory, setByCategory] = useState([])
  const [trends, setTrends] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [topMerchants, setTopMerchants] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [monthFilter, setMonthFilter] = useState(null)
  const [monthsLoaded, setMonthsLoaded] = useState(false)
  const [accountFilter, setAccountFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [merchantSearch, setMerchantSearch] = useState("")

  useEffect(() => {
    if (monthsLoaded) return
    getDashboardTrends({}).then(tr => {
      if (tr.length > 0) {
        setMonthFilter(tr[tr.length - 1].month)
      } else {
        setMonthFilter("")
      }
      setMonthsLoaded(true)
    })
  }, [monthsLoaded])

  const buildFilters = useCallback(() => {
    const filters = {}
    if (accountFilter) filters.account_id = accountFilter
    if (categoryFilter) filters.category_id = categoryFilter
    if (merchantSearch) filters.search = merchantSearch
    if (monthFilter) {
      filters.start_date = `${monthFilter}-01`
      const [y, m] = monthFilter.split("-").map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      filters.end_date = `${monthFilter}-${String(lastDay).padStart(2, "0")}`
    }
    return filters
  }, [monthFilter, accountFilter, categoryFilter, merchantSearch])

  const fetchData = useCallback(async () => {
    if (!monthsLoaded) return
    setLoading(true)
    try {
      const filters = buildFilters()
      const [s, bc, tr, tc, tm, accts, cats] = await Promise.all([
        getDashboardSummary(filters),
        getDashboardByCategory(filters),
        getDashboardTrends({}),
        getDashboardTopCategories(filters),
        getDashboardTopMerchants(filters),
        getAccounts(),
        getCategories(),
      ])
      setSummary(s)
      setByCategory(bc)
      setTrends(tr)
      setTopCategories(tc)
      setTopMerchants(tm)
      setAccounts(accts)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }, [buildFilters, monthsLoaded])

  useEffect(() => { fetchData() }, [fetchData])

  const fmt = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtMonth = (m) => {
    const [y, mo] = m.split("-")
    const date = new Date(y, mo - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
        <p className="text-sm font-medium">{label?.includes("-") ? fmtMonth(label) : label}</p>
        <p className="text-sm text-muted-foreground">{fmt(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Track that spend.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          type="month"
          value={monthFilter || ""}
          onChange={e => setMonthFilter(e.target.value)}
          className="w-40"
          placeholder="All time"
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
        <Select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchant..."
            value={merchantSearch}
            onChange={e => setMerchantSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><div className="h-4 w-24 rounded bg-muted animate-pulse" /></CardHeader>
                <CardContent><div className="h-8 w-20 rounded bg-muted animate-pulse" /></CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader><div className="h-5 w-40 rounded bg-muted animate-pulse" /></CardHeader>
                <CardContent><div className="h-[300px] rounded bg-muted animate-pulse" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-4 grid-cols-2 ${monthFilter ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmt(summary?.total_spending || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.transaction_count || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.top_category?.name || "—"}
                </div>
                {summary?.top_category && (
                  <p className="text-xs text-muted-foreground">{fmt(summary.top_category.total)}</p>
                )}
              </CardContent>
            </Card>

            {monthFilter && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">vs Last Month</CardTitle>
                  {summary?.month_over_month ? (
                    summary.month_over_month.change_pct > 0
                      ? <ArrowUpRight className="h-4 w-4 text-red-500" />
                      : <ArrowDownRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  {summary?.month_over_month ? (
                    <>
                      <div className={`text-2xl font-bold ${summary.month_over_month.change_pct > 0 ? "text-red-500" : "text-green-500"}`}>
                        {summary.month_over_month.change_pct > 0 ? "+" : ""}{summary.month_over_month.change_pct}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmtMonth(summary.month_over_month.prev_month)}: {fmt(summary.month_over_month.previous)}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">—</div>
                      <p className="text-xs text-muted-foreground">No data for previous month</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className={monthFilter ? "" : "grid gap-4 md:grid-cols-2"}>
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No data to display</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byCategory} margin={{ top: 5, right: 5, bottom: 60, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {byCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {!monthFilter && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {trends.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No data to display</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={fmtMonth} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="oklch(0.646 0.222 41.116)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right w-16">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCategories.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                              {c.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{fmt(c.total)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{c.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                {topMerchants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right w-16">Txns</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMerchants.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="truncate max-w-48">{m.merchant}</TableCell>
                          <TableCell className="text-right">{fmt(m.total)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{m.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
