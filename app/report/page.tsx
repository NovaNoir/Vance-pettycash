"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function ReportPage() {
  const { state } = usePettyCash()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [hasGenerated, setHasGenerated] = useState(false)

  const reportData = useMemo(() => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    const filteredTransactions = state.transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= start && transactionDate <= end
    })

    const totalDisbursed = filteredTransactions
      .filter((t) => t.type === "disbursement")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalReplenished = filteredTransactions
      .filter((t) => t.type === "replenishment")
      .reduce((sum, t) => sum + t.amount, 0)

    const netChange = totalReplenished - totalDisbursed

    // Group transactions by month for chart
    const monthlyData = filteredTransactions.reduce(
      (acc, transaction) => {
        const month = new Date(transaction.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })

        if (!acc[month]) {
          acc[month] = { month, disbursed: 0, replenished: 0 }
        }

        if (transaction.type === "disbursement") {
          acc[month].disbursed += transaction.amount
        } else if (transaction.type === "replenishment") {
          acc[month].replenished += transaction.amount
        }

        return acc
      },
      {} as Record<string, { month: string; disbursed: number; replenished: number }>,
    )

    const chartData = Object.values(monthlyData)

    // Transaction type distribution
    const typeDistribution = [
      {
        name: "Disbursements",
        value: totalDisbursed,
        count: filteredTransactions.filter((t) => t.type === "disbursement").length,
      },
      {
        name: "Replenishments",
        value: totalReplenished,
        count: filteredTransactions.filter((t) => t.type === "replenishment").length,
      },
    ].filter((item) => item.value > 0)

    return {
      totalDisbursed,
      totalReplenished,
      netChange,
      transactionCount: filteredTransactions.length,
      chartData,
      typeDistribution,
      transactions: filteredTransactions,
    }
  }, [state.transactions, startDate, endDate])

  const generateReport = () => {
    if (!startDate || !endDate) return
    setHasGenerated(true)
  }

  const downloadReport = () => {
    if (!reportData) return

    const reportContent = `
PETTY CASH REPORT
Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

SUMMARY
=======
Total Disbursed: $${reportData.totalDisbursed.toFixed(2)}
Total Replenished: $${reportData.totalReplenished.toFixed(2)}
Net Change: $${reportData.netChange.toFixed(2)}
Total Transactions: ${reportData.transactionCount}
Current Balance: $${state.balance.toFixed(2)}

TRANSACTIONS
============
${reportData.transactions
  .map(
    (t) =>
      `${new Date(t.date).toLocaleDateString()} | ${t.type.toUpperCase()} | $${t.amount.toFixed(2)} | ${t.purpose || "N/A"} | ${t.recipient || "N/A"}`,
  )
  .join("\n")}
    `.trim()

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `petty-cash-report-${startDate}-to-${endDate}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!state.isInitialized) {
    return (
      <AppLayout>
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
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Generate Report</h1>
          <p className="text-muted-foreground">Create a comprehensive summary report for any date range</p>
        </div>

        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Report Period</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

              <Button onClick={generateReport} disabled={!startDate || !endDate} className="w-full">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {hasGenerated && reportData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${reportData.totalDisbursed.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Replenished</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${reportData.totalReplenished.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${reportData.netChange >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {reportData.netChange >= 0 ? "+" : ""}${reportData.netChange.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">${state.balance.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {reportData.chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        disbursed: {
                          label: "Disbursed",
                          color: "hsl(var(--destructive))",
                        },
                        replenished: {
                          label: "Replenished",
                          color: "hsl(var(--primary))",
                        },
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
                    <CardTitle>Transaction Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        disbursements: {
                          label: "Disbursements",
                          color: "hsl(var(--destructive))",
                        },
                        replenishments: {
                          label: "Replenishments",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.typeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {reportData.typeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Download Button */}
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadReport} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            {reportData.transactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details ({reportData.transactions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reportData.transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === "disbursement"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {transaction.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-medium ${
                              transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {transaction.type === "disbursement" ? "-" : "+"}${transaction.amount.toFixed(2)}
                          </div>
                          {transaction.purpose && (
                            <div className="text-sm text-muted-foreground">{transaction.purpose}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {hasGenerated && !reportData && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No transactions found for the selected date range.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
