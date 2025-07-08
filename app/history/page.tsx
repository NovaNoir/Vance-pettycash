"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { Search, Filter, Download, Eye, Calendar, User, FileText, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { Modal } from "@/components/ui/modal"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/contexts/PettyCashContext"

const ITEMS_PER_PAGE = 10

export default function HistoryPage() {
  const { state } = usePettyCash()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Handle URL parameters for filtering
  useEffect(() => {
    const filterParam = searchParams.get("filter")
    const transactionParam = searchParams.get("transaction")

    if (filterParam && ["disbursement", "replenishment", "initialization"].includes(filterParam)) {
      setTypeFilter(filterParam)
    }

    if (transactionParam) {
      const transaction = state.transactions.find((t) => t.id === transactionParam)
      if (transaction) {
        setSelectedTransaction(transaction)
      }
    }
  }, [searchParams, state.transactions])

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.amount.toString().includes(searchTerm) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(endDate))
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [state.transactions, searchTerm, typeFilter, startDate, endDate])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Type", "Amount", "Purpose", "Recipient", "Transaction ID"]
    const csvData = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.amount.toFixed(2),
      t.purpose || "",
      t.recipient || "",
      t.id,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `petty-cash-history-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Transaction history has been exported to CSV.",
    })
  }

  const hasActiveFilters = searchTerm || typeFilter !== "all" || startDate || endDate

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">
              {filteredTransactions.length} of {state.transactions.length} transactions
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={filteredTransactions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="disbursement">Disbursements</SelectItem>
                    <SelectItem value="replenishment">Replenishments</SelectItem>
                    <SelectItem value="initialization">Initialization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="startDate">From Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">To Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "No transactions match your filters" : "No transactions found"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {transaction.id}</div>
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

                      <div className="flex-1 min-w-0">
                        {transaction.purpose && (
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{transaction.purpose}</span>
                          </div>
                        )}
                        {transaction.recipient && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{transaction.recipient}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {transaction.type === "disbursement" ? "-" : "+"}${transaction.amount.toFixed(2)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}{" "}
                  transactions
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Modal */}
        <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Transaction Details">
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedTransaction.type === "disbursement"
                          ? "destructive"
                          : selectedTransaction.type === "replenishment"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {selectedTransaction.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p>{new Date(selectedTransaction.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p
                    className={`text-lg font-bold ${
                      selectedTransaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {selectedTransaction.type === "disbursement" ? "-" : "+"}${selectedTransaction.amount.toFixed(2)}
                  </p>
                </div>
                {selectedTransaction.purpose && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                    <p>{selectedTransaction.purpose}</p>
                  </div>
                )}
                {selectedTransaction.recipient && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Recipient</Label>
                    <p>{selectedTransaction.recipient}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Timestamp</Label>
                  <p className="text-sm">{new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  )
}
