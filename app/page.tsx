"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  BarChart3,
  AlertTriangle,
  Clock,
  Receipt,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { ChartContainer } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from "recharts"
import Link from "next/link"
import { useRouter } from "next/navigation"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

type DateRange = "7days" | "30days" | "90days" | "custom"

export default function Dashboard() {
  const { state } = usePettyCash()
  const router = useRouter()

  const [dateRange, setDateRange] = useState<DateRange>("30days")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  // Get low balance threshold from localStorage
  const lowBalanceThreshold = useMemo(() => {
    if (typeof window !== "undefined") {
      return Number.parseFloat(localStorage.getItem("lowBalanceThreshold") || "100")
    }
    return 100
  }, [])

  // Calculate date range
  const getDateRange = () => {
    const end = new Date()
    let start = new Date()

    switch (dateRange) {
      case "7days":
        start.setDate(start.getDate() - 7)
        break
      case "30days":
        start.setDate(start.getDate() - 30)
        break
      case "90days":
        start.setDate(start.getDate() - 90)
        break
      case "custom":
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate)
          end.setTime(new Date(customEndDate).getTime())
        }
        break
    }

    return { start, end }
  }

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const { start, end } = getDateRange()

    const filteredTransactions = state.transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= start && transactionDate <= end
    })

    const totalDisbursed = state.transactions
      .filter((t) => t.type === "disbursement")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalReplenished = state.transactions
      .filter((t) => t.type === "replenishment")
      .reduce((sum, t) => sum + t.amount, 0)

    const periodDisbursed = filteredTransactions
      .filter((t) => t.type === "disbursement")
      .reduce((sum, t) => sum + t.amount, 0)

    const periodReplenished = filteredTransactions
      .filter((t) => t.type === "replenishment")
      .reduce((sum, t) => sum + t.amount, 0)

    // Group disbursements by purpose for category analysis
    const disbursementsByPurpose = filteredTransactions
      .filter((t) => t.type === "disbursement" && t.purpose)
      .reduce(
        (acc, t) => {
          const purpose = t.purpose || "Other"
          acc[purpose] = (acc[purpose] || 0) + t.amount
          return acc
        },
        {} as Record<string, number>,
      )

    const categoryData = Object.entries(disbursementsByPurpose)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Balance trend over time (last 10 transactions or filtered)
    const relevantTransactions = dateRange === "custom" ? filteredTransactions : state.transactions.slice(-10)
    const balanceHistory = relevantTransactions.reduce(
      (acc, transaction, index) => {
        const prevBalance =
          index === 0
            ? state.transactions.find((t) => t.type === "initialization")?.amount || 0
            : acc[index - 1].balance

        let newBalance = prevBalance
        if (transaction.type === "disbursement") {
          newBalance = prevBalance - transaction.amount
        } else if (transaction.type === "replenishment") {
          newBalance = prevBalance + transaction.amount
        } else if (transaction.type === "initialization") {
          newBalance = transaction.amount
        }

        acc.push({
          date: new Date(transaction.date).toLocaleDateString(),
          balance: newBalance,
          transaction: transaction.type,
          amount: transaction.amount,
        })
        return acc
      },
      [] as Array<{ date: string; balance: number; transaction: string; amount: number }>,
    )

    return {
      totalDisbursed,
      totalReplenished,
      periodDisbursed,
      periodReplenished,
      categoryData,
      balanceHistory,
      recentTransactions: state.transactions.slice(-5).reverse(),
      filteredTransactions,
    }
  }, [state.transactions, state.balance, dateRange, customStartDate, customEndDate])

  // Low balance warning
  const isLowBalance = state.balance < lowBalanceThreshold

  // Handle card clicks for drill-down
  const handleCardClick = (type: "disbursement" | "replenishment") => {
    router.push(`/history?filter=${type}`)
  }

  if (!state.isInitialized) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <DollarSign className="h-6 w-6" />
                  <span>Welcome to Petty Cash Manager</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Get started by initializing your petty cash fund with an initial amount.
                </p>
                <Link href="/initialize">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Initialize Fund
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with Date Range Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your petty cash fund</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-36"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-36"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Link href="/disburse">
                <Button>
                  <Minus className="h-4 w-4 mr-2" />
                  Record Disbursement
                </Button>
              </Link>
              <Link href="/replenish">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Replenish Fund
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Low Balance Alert */}
        {isLowBalance && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Low Balance Warning:</strong> Your petty cash balance is below ${lowBalanceThreshold.toFixed(2)}
                . Consider replenishing the fund soon.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${state.balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick("disbursement")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${metrics.totalDisbursed.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Selected period: ${metrics.periodDisbursed.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick("replenishment")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Replenished</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${metrics.totalReplenished.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Selected period: ${metrics.periodReplenished.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{state.transactions.length}</div>
                <p className="text-xs text-muted-foreground">Selected period: {metrics.filteredTransactions.length}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Balance Trend */}
          {metrics.balanceHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Balance Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      balance: {
                        label: "Balance",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.balanceHistory}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-sm">
                                    Balance: <span className="font-medium">${data.balance.toFixed(2)}</span>
                                  </p>
                                  <p className="text-sm">
                                    Transaction: <span className="font-medium">{data.transaction}</span>
                                  </p>
                                  <p className="text-sm">
                                    Amount: <span className="font-medium">${data.amount.toFixed(2)}</span>
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke="var(--color-balance)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-balance)", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "var(--color-balance)", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Spending by Category */}
          {metrics.categoryData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Amount",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: $${value.toFixed(2)} (${(percent * 100).toFixed(1)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {metrics.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-sm">Amount: ${data.value.toFixed(2)}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Transactions</span>
              </CardTitle>
              <Link href="/history">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {metrics.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/history?transaction=${transaction.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
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
                        {transaction.purpose && <div className="text-sm font-medium">{transaction.purpose}</div>}
                        {transaction.recipient && (
                          <div className="text-sm text-muted-foreground">to {transaction.recipient}</div>
                        )}
                      </div>
                      <div
                        className={`font-medium ${
                          transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {transaction.type === "disbursement" ? "-" : "+"}${transaction.amount.toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/disburse">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                    <Minus className="h-6 w-6" />
                    <span>Disburse</span>
                  </Button>
                </Link>
                <Link href="/replenish">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                    <Plus className="h-6 w-6" />
                    <span>Replenish</span>
                  </Button>
                </Link>
                <Link href="/reconcile">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                    <BarChart3 className="h-6 w-6" />
                    <span>Reconcile</span>
                  </Button>
                </Link>
                <Link href="/report">
                  <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                    <Receipt className="h-6 w-6" />
                    <span>Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
