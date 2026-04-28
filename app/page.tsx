"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { formatCurrency } from "@/lib/security"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Minus,
  History,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function Dashboard() {
  const { state } = usePettyCash()
  const { privacyMode } = usePrivacy()

  if (!state.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Welcome to Petty Cash Manager</CardTitle>
            <CardDescription>
              Get started by initializing your petty cash fund to begin tracking transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/initialize">Initialize Petty Cash Fund</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recentTransactions = state.transactions.slice(0, 5)
  const totalDisbursements = state.transactions
    .filter((t) => t.type === "disbursement")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalReplenishments = state.transactions
    .filter((t) => t.type === "replenishment")
    .reduce((sum, t) => sum + t.amount, 0)

  const balancePercentage = state.initialAmount > 0 ? (state.balance / state.initialAmount) * 100 : 0
  const isLowBalance = state.balance < state.settings.lowBalanceThreshold

  const displayAmount = (amount: number) => {
    return privacyMode ? "****.**" : formatCurrency(amount, state.settings.currency)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your petty cash fund and recent activity</p>
      </div>

      {/* Low Balance Alert */}
      {isLowBalance && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800 dark:text-amber-200">Low Balance Warning</CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Your petty cash balance is below the threshold of {displayAmount(state.settings.lowBalanceThreshold)}.
              Consider replenishing the fund.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
            >
              <Link href="/replenish">Replenish Fund</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayAmount(state.balance)}</div>
            <div className="mt-2">
              <Progress value={balancePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{balancePercentage.toFixed(1)}% of initial amount</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursements</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{displayAmount(totalDisbursements)}</div>
            <p className="text-xs text-muted-foreground">
              {state.transactions.filter((t) => t.type === "disbursement").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replenishments</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayAmount(totalReplenishments)}</div>
            <p className="text-xs text-muted-foreground">
              {state.transactions.filter((t) => t.type === "replenishment").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Last updated {format(new Date(state.lastUpdated), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common petty cash operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-20 flex-col gap-2">
              <Link href="/disburse">
                <Minus className="h-6 w-6" />
                Record Disbursement
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/replenish">
                <Plus className="h-6 w-6" />
                Replenish Fund
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/reconcile">
                <RefreshCw className="h-6 w-6" />
                Reconcile Balance
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/report">
                <BarChart3 className="h-6 w-6" />
                Generate Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest petty cash activity</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/history">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start by recording your first disbursement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "disbursement"
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                          : transaction.type === "replenishment"
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      }`}
                    >
                      {transaction.type === "disbursement" ? (
                        <Minus className="h-4 w-4" />
                      ) : transaction.type === "replenishment" ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(transaction.date), "MMM d, yyyy")}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category}
                            </Badge>
                          </>
                        )}
                        <Badge
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-right font-medium ${
                      transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {transaction.type === "disbursement" ? "-" : "+"}
                    {displayAmount(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
