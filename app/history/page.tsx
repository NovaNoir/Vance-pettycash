"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Calendar, DollarSign, Download, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import type { Transaction } from "@/contexts/PettyCashContext"

export default function HistoryPage() {
  const { state } = usePettyCash()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = state.transactions

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType)
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(dateTo))
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        comparison = a.amount - b.amount
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [state.transactions, searchTerm, filterType, sortBy, sortOrder, dateFrom, dateTo])

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Amount", "Purpose", "Recipient", "Transaction ID"]
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedTransactions.map((t) =>
        [t.date, t.type, t.amount.toFixed(2), `"${t.purpose || ""}"`, `"${t.recipient || ""}"`, t.id].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `petty-cash-history-${new Date().toISOString().split("T")[0]}.csv`
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">View and filter all your petty cash transactions</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={filteredAndSortedTransactions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Enhanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="initialization">Initialization</SelectItem>
                  <SelectItem value="disbursement">Disbursement</SelectItem>
                  <SelectItem value="replenishment">Replenishment</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                />
              </div>

              <Select value={sortBy} onValueChange={(value: "date" | "amount") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterType !== "all" || dateFrom || dateTo) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterType("all")
                    setDateFrom("")
                    setDateTo("")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredAndSortedTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAndSortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
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
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div
                            className={`font-medium flex items-center space-x-1 ${
                              transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {transaction.type === "disbursement" ? "-" : "+"}
                              {transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                                  <div className="font-mono text-sm">{transaction.id}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Type</span>
                                  <div className="capitalize">{transaction.type}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Date</span>
                                  <div>{new Date(transaction.date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Amount</span>
                                  <div
                                    className={`font-medium ${
                                      transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                                    }`}
                                  >
                                    {transaction.type === "disbursement" ? "-" : "+"}${transaction.amount.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              {transaction.recipient && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Recipient</span>
                                  <div>{transaction.recipient}</div>
                                </div>
                              )}
                              {transaction.purpose && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Purpose</span>
                                  <div>{transaction.purpose}</div>
                                </div>
                              )}
                              <div>
                                <span className="text-sm text-muted-foreground">Timestamp</span>
                                <div className="text-sm">{new Date(transaction.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="text-sm text-muted-foreground">ID: {transaction.id}</div>
                      {transaction.recipient && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Recipient:</span> {transaction.recipient}
                        </div>
                      )}
                      {transaction.purpose && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Purpose:</span> {transaction.purpose}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
