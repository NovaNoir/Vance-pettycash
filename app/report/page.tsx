"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  FileText,
  BarChart3,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { formatCurrency, formatDate, exportToCSV, exportToPDF, searchInText } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { toast } from "sonner"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"]

export default function ReportPage() {
  const { state } = usePettyCash()
  const { hideAmounts } = usePrivacy()

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [reportType, setReportType] = useState("summary")
  const [hasGenerated, setHasGenerated] = useState(false)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    state.transactions.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats).sort()
  }, [state.transactions])

  const reportData = useMemo(() => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    const filteredTransactions = state.transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      const dateInRange = transactionDate >= start && transactionDate <= end

      const categoryMatch = categoryFilter === "all" || t.category === categoryFilter

      const keywordMatch =
        !searchKeyword ||
        searchInText(t.description, searchKeyword) ||
        searchInText(t.recipient || "", searchKeyword) ||
        searchInText(t.category || "", searchKeyword)

      return dateInRange && categoryMatch && keywordMatch
    })

    const totalDisbursed = filteredTransactions
      .filter((t) => t.type === "disbursement")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalReplenished = filteredTransactions
      .filter((t) => t.type === "replenishment")
      .reduce((sum, t) => sum + t.amount, 0)

    const netChange = totalReplenished - totalDisbursed

    // Monthly breakdown
    const monthlyData = filteredTransactions.reduce(
      (acc, transaction) => {
        const month = new Date(transaction.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })

        if (!acc[month]) {
          acc[month] = { month, disbursed: 0, replenished: 0, net: 0 }
        }

        if (transaction.type === "disbursement") {
          acc[month].disbursed += transaction.amount
        } else if (transaction.type === "replenishment") {
          acc[month].replenished += transaction.amount
        }

        acc[month].net = acc[month].replenished - acc[month].disbursed

        return acc
      },
      {} as Record<string, { month: string; disbursed: number; replenished: number; net: number }>,
    )

    const chartData = Object.values(monthlyData)

    // Category analysis
    const categoryAnalysis = filteredTransactions
      .filter((t) => t.type === "disbursement" && t.category)
      .reduce(
        (acc, t) => {
          const category = t.category!
          if (!acc[category]) {
            acc[category] = { name: category, value: 0, count: 0, avgAmount: 0 }
          }
          acc[category].value += t.amount
          acc[category].count += 1
          acc[category].avgAmount = acc[category].value / acc[category].count
          return acc
        },
        {} as Record<string, { name: string; value: number; count: number; avgAmount: number }>,
      )

    const categoryData = Object.values(categoryAnalysis).sort((a, b) => b.value - a.value)

    // Recipient analysis
    const recipientAnalysis = filteredTransactions
      .filter((t) => t.type === "disbursement" && t.recipient)
      .reduce(
        (acc, t) => {
          const recipient = t.recipient!
          if (!acc[recipient]) {
            acc[recipient] = { name: recipient, value: 0, count: 0 }
          }
          acc[recipient].value += t.amount
          acc[recipient].count += 1
          return acc
        },
        {} as Record<string, { name: string; value: number; count: number }>,
      )

    const recipientData = Object.values(recipientAnalysis)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 recipients

    // Daily spending pattern
    const dailyPattern = filteredTransactions
      .filter((t) => t.type === "disbursement")
      .reduce(
        (acc, t) => {
          const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" })
          acc[day] = (acc[day] || 0) + t.amount
          return acc
        },
        {} as Record<string, number>,
      )

    const dailyData = Object.entries(dailyPattern).map(([day, amount]) => ({
      day,
      amount,
    }))

    // Transaction frequency analysis
    const transactionFrequency = {
      daily:
        filteredTransactions.length / Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
      weekly:
        filteredTransactions.length /
        Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))),
      monthly:
        filteredTransactions.length /
        Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))),
    }

    // Largest transactions
    const largestTransactions = [...filteredTransactions].sort((a, b) => b.amount - a.amount).slice(0, 5)

    return {
      totalDisbursed,
      totalReplenished,
      netChange,
      transactionCount: filteredTransactions.length,
      chartData,
      categoryData,
      recipientData,
      dailyData,
      transactionFrequency,
      largestTransactions,
      transactions: filteredTransactions,
      averageTransaction:
        filteredTransactions.length > 0
          ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length
          : 0,
    }
  }, [state.transactions, startDate, endDate, categoryFilter, searchKeyword])

  const generateReport = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates")
      return
    }
    setHasGenerated(true)
  }

  const downloadDetailedReport = () => {
    if (!reportData) return

    const reportContent = `
PETTY CASH DETAILED REPORT
==========================
Period: ${formatDate(startDate)} - ${formatDate(endDate)}
Generated: ${new Date().toLocaleString()}
Report Type: ${reportType.toUpperCase()}
${categoryFilter !== "all" ? `Category Filter: ${categoryFilter}` : ""}
${searchKeyword ? `Search Keyword: ${searchKeyword}` : ""}

EXECUTIVE SUMMARY
================
Current Balance: ${formatCurrency(state.balance)}
Total Disbursed: ${formatCurrency(reportData.totalDisbursed)}
Total Replenished: ${formatCurrency(reportData.totalReplenished)}
Net Change: ${formatCurrency(reportData.netChange)}
Total Transactions: ${reportData.transactionCount}
Average Transaction: ${formatCurrency(reportData.averageTransaction)}

TRANSACTION FREQUENCY
====================
Daily Average: ${reportData.transactionFrequency.daily.toFixed(2)} transactions
Weekly Average: ${reportData.transactionFrequency.weekly.toFixed(2)} transactions
Monthly Average: ${reportData.transactionFrequency.monthly.toFixed(2)} transactions

CATEGORY BREAKDOWN
==================
${reportData.categoryData
  .map(
    (cat) =>
      `${cat.name}: ${formatCurrency(cat.value)} (${cat.count} transactions, avg: ${formatCurrency(cat.avgAmount)})`,
  )
  .join("\n")}

TOP RECIPIENTS
==============
${reportData.recipientData
  .map((rec) => `${rec.name}: ${formatCurrency(rec.value)} (${rec.count} transactions)`)
  .join("\n")}

LARGEST TRANSACTIONS
===================
${reportData.largestTransactions
  .map(
    (t) =>
      `${formatDate(t.date)} | ${t.type.toUpperCase()} | ${formatCurrency(t.amount)} | ${t.description} | ${t.recipient || "N/A"}`,
  )
  .join("\n")}

DETAILED TRANSACTIONS
====================
${reportData.transactions
  .map(
    (t) =>
      `${formatDate(t.date)} | ${t.type.toUpperCase()} | ${formatCurrency(t.amount)} | ${t.description} | ${t.category || "N/A"} | ${t.recipient || "N/A"} | ${t.status} | ${t.id}`,
  )
  .join("\n")}

NOTES
=====
- All amounts are in USD
- Transactions are sorted by date (newest first)
- This report includes ${reportData.transactions.length} transactions out of ${state.transactions.length} total transactions
- Report generated by Petty Cash Manager v1.0
    `.trim()

    exportToPDF(reportContent, `petty-cash-detailed-report-${startDate}-to-${endDate}`)
  }

  const downloadCSVReport = () => {
    if (!reportData) return

    const csvData = reportData.transactions.map((t) => ({
      Date: formatDate(t.date),
      Type: t.type,
      Amount: t.amount.toFixed(2),
      Description: t.description,
      Category: t.category || "",
      Recipient: t.recipient || "",
      Status: t.status,
      "Transaction ID": t.id,
    }))

    exportToCSV(csvData, `petty-cash-report-${startDate}-to-${endDate}.csv`)
  }

  if (!state.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Fund Not Initialized</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Please initialize your petty cash fund first.</p>
            <Button onClick={() => (window.location.href = "/initialize")}>Initialize Fund</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Enhanced Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive reports with advanced filtering and insights</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Report Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search in descriptions..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateReport} disabled={!startDate || !endDate} className="mt-6">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {hasGenerated && reportData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.totalDisbursed, "USD", hideAmounts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.transactions.filter((t) => t.type === "disbursement").length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Replenished</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.totalReplenished, "USD", hideAmounts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.transactions.filter((t) => t.type === "replenishment").length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.netChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {reportData.netChange >= 0 ? "+" : ""}
                  {formatCurrency(reportData.netChange, "USD", hideAmounts)}
                </div>
                <p className="text-xs text-muted-foreground">Period change</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.averageTransaction, "USD", hideAmounts)}
                </div>
                <p className="text-xs text-muted-foreground">Average amount</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(state.balance, "USD", hideAmounts)}
                </div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadDetailedReport} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
                <Button onClick={downloadCSVReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Content Tabs */}
          <Tabs defaultValue="charts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="charts">Charts & Trends</TabsTrigger>
              <TabsTrigger value="categories">Category Analysis</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              {reportData.chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          disbursed: { label: "Disbursed", color: "hsl(var(--destructive))" },
                          replenished: { label: "Replenished", color: "hsl(var(--primary))" },
                          net: { label: "Net Change", color: "hsl(var(--secondary))" },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportData.chartData}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="disbursed" fill="var(--color-disbursed)" />
                            <Bar dataKey="replenished" fill="var(--color-replenished)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Net Change Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          net: { label: "Net Change", color: "hsl(var(--primary))" },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportData.chartData}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="net"
                              stroke="var(--color-net)"
                              strokeWidth={2}
                              dot={{ fill: "var(--color-net)", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.categoryData.length > 0 ? (
                      <ChartContainer
                        config={{
                          value: { label: "Amount", color: "hsl(var(--primary))" },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={reportData.categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) =>
                                `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportData.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No category data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.categoryData.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {category.count} transactions • Avg: {formatCurrency(category.avgAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(category.value, "USD", hideAmounts)}</p>
                            <Badge variant="secondary" className="text-xs">
                              {((category.value / reportData.totalDisbursed) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.recipientData.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.recipientData.map((recipient, index) => (
                        <div key={recipient.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{recipient.name}</p>
                              <p className="text-sm text-muted-foreground">{recipient.count} transactions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(recipient.value, "USD", hideAmounts)}</p>
                            <p className="text-sm text-muted-foreground">
                              Avg: {formatCurrency(recipient.value / recipient.count)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No recipient data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Transaction Details ({reportData.transactions.length})</CardTitle>
                    <Badge variant="secondary">
                      {reportData.transactions.length} of {state.transactions.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportData.transactions.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reportData.transactions.slice(0, 20).map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-muted-foreground">{formatDate(transaction.date)}</div>
                            <Badge
                              variant={
                                transaction.type === "disbursement"
                                  ? "destructive"
                                  : transaction.type === "replenishment"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {transaction.type}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{transaction.description}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {transaction.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.category}
                                  </Badge>
                                )}
                                {transaction.recipient && <span>• {transaction.recipient}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium ${
                                transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {transaction.type === "disbursement" ? "-" : "+"}
                              {formatCurrency(transaction.amount, "USD", hideAmounts)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {reportData.transactions.length > 20 && (
                        <p className="text-center text-muted-foreground text-sm">
                          Showing first 20 transactions. Download full report for complete data.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No transactions found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {hasGenerated && !reportData && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No transactions found for the selected criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or date range.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
