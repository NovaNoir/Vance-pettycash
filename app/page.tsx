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
  Shield,
  FileText,
  Zap,
  Target,
  ArrowRight,
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
            className="max-w-2xl w-full"
          >
            <Card className="text-center">
              <CardHeader className="pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
                >
                  <DollarSign className="h-8 w-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl mb-2">Welcome to Petty Cash Manager</CardTitle>
                <p className="text-muted-foreground text-lg">
                  Your complete solution for managing petty cash funds with confidence and control
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20"
                  >
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-green-100">Track Expenses</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Monitor every disbursement with detailed records
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20"
                  >
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Stay Compliant</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Built-in reconciliation and audit trails
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20"
                  >
                    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">Generate Reports</h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Comprehensive analytics and export options
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Getting Started */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Get Started in 3 Easy Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Initialize Fund</p>
                        <p className="text-sm text-muted-foreground">Set your starting balance</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Record Transactions</p>
                        <p className="text-sm text-muted-foreground">Track disbursements & replenishments</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Monitor & Report</p>
                        <p className="text-sm text-muted-foreground">Reconcile and generate reports</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Link href="/initialize">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Zap className="h-4 w-4 mr-2" />
                      Initialize Your Fund
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
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
                <Button className="bg-red-600 hover:bg-red-700">
                  <Minus className="h-4 w-4 mr-2" />
                  Record Disbursement
                </Button>
              </Link>
              <Link href="/replenish">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 bg-transparent"
                >
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

        {/* Quick Overview Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">Fund Overview</h2>
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Current Balance</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">${state.balance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Total Transactions</p>
                      <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                        {state.transactions.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Last Activity</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {state.transactions.length > 0
                          ? new Date(state.transactions[state.transactions.length - 1].date).toLocaleDateString()
                          : "No activity"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="hover:shadow-md transition-shadow">
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
              className="cursor-pointer hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-800"
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
              className="cursor-pointer hover:shadow-md transition-all hover:border-green-200 dark:hover:border-green-800"
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
            <Card className="hover:shadow-md transition-shadow">
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

        {/* Recent Activity Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <Link href="/history">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {metrics.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">Your transactions will appear here</p>
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
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col space-y-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                  >
                    <Minus className="h-6 w-6" />
                    <span>Record Disbursement</span>
                  </Button>
                </Link>
                <Link href="/replenish">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col space-y-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:hover:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                  >
                    <Plus className="h-6 w-6" />
                    <span>Replenish Fund</span>
                  </Button>
                </Link>
                <Link href="/reconcile">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col space-y-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span>Reconcile</span>
                  </Button>
                </Link>
                <Link href="/report">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col space-y-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300"
                  >
                    <FileText className="h-6 w-6" />
                    <span>Generate Report</span>
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
