"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Undo2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { usePettyCash, type Transaction } from "@/contexts/PettyCashContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { formatCurrency, formatDate, searchInText } from "@/lib/utils"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 10

export default function HistoryPage() {
  const { state, addTransaction } = usePettyCash()
  const { hideAmounts } = usePrivacy()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [transactionToReverse, setTransactionToReverse] = useState<Transaction | null>(null)
  const [isReversing, setIsReversing] = useState(false)

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

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>()
    state.transactions.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats).sort()
  }, [state.transactions])

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          searchInText(t.description, searchTerm) ||
          searchInText(t.recipient || "", searchTerm) ||
          searchInText(t.amount.toString(), searchTerm) ||
          searchInText(t.id, searchTerm) ||
          searchInText(t.category || "", searchTerm),
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter)
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
  }, [state.transactions, searchTerm, typeFilter, categoryFilter, startDate, endDate])

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
    setCategoryFilter("all")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  // Export to CSV
  const exportToCSV = () => {
    const exportData = filteredTransactions.map((t) => ({
      Date: formatDate(t.date),
      Type: t.type,
      Amount: t.amount.toFixed(2),
      Description: t.description,
      Category: t.category || "",
      Recipient: t.recipient || "",
      Status: t.status,
      "Transaction ID": t.id,
    }))

    exportToCSV(exportData, `petty-cash-history-${new Date().toISOString().split("T")[0]}.csv`)
    toast.success("Transaction history exported to CSV")
  }

  // Reverse transaction
  const handleReverseTransaction = async () => {
    if (!transactionToReverse) return

    setIsReversing(true)

    try {
      // Create reverse transaction
      const reverseTransaction = {
        type: transactionToReverse.type === "disbursement" ? "replenishment" : ("disbursement" as const),
        amount: transactionToReverse.amount,
        description: `REVERSAL: ${transactionToReverse.description}`,
        category: transactionToReverse.category,
        recipient: transactionToReverse.recipient,
        status: "approved" as const,
      }

      addTransaction(reverseTransaction)

      toast.success(`Transaction reversed: ${formatCurrency(transactionToReverse.amount)}`)

      setShowReverseDialog(false)
      setTransactionToReverse(null)

      // Navigate to disbursement page if reversing a disbursement
      if (transactionToReverse.type === "disbursement") {
        setTimeout(() => {
          router.push("/disburse")
        }, 1500)
      }
    } catch (error) {
      toast.error("Failed to reverse transaction. Please try again.")
    } finally {
      setIsReversing(false)
    }
  }

  const hasActiveFilters = searchTerm || typeFilter !== "all" || categoryFilter !== "all" || startDate || endDate

  if (!state.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Fund Not Initialized</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Please initialize your petty cash fund first.</p>
            <Button onClick={() => router.push("/initialize")}>Initialize Fund</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
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
                        <span className="text-sm font-medium">{formatDate(transaction.date)}</span>
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
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{transaction.description}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {transaction.category && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                        )}
                        {transaction.recipient && (
                          <>
                            <User className="h-3 w-3" />
                            <span className="truncate">{transaction.recipient}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {transaction.type === "disbursement" ? "-" : "+"}
                        {formatCurrency(transaction.amount, "USD", hideAmounts)}
                      </div>
                      <Badge variant={transaction.status === "approved" ? "default" : "secondary"} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Reverse button - only for disbursements and replenishments */}
                      {(transaction.type === "disbursement" || transaction.type === "replenishment") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTransactionToReverse(transaction)
                            setShowReverseDialog(true)
                          }}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Complete information about this transaction</DialogDescription>
          </DialogHeader>
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
                  <p>{formatDate(selectedTransaction.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p
                    className={`text-lg font-bold ${
                      selectedTransaction.type === "disbursement" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {selectedTransaction.type === "disbursement" ? "-" : "+"}
                    {formatCurrency(selectedTransaction.amount, "USD", hideAmounts)}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p>{selectedTransaction.description}</p>
                </div>
                {selectedTransaction.category && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p>{selectedTransaction.category}</p>
                  </div>
                )}
                {selectedTransaction.recipient && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Recipient</Label>
                    <p>{selectedTransaction.recipient}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTransaction.status === "approved" ? "default" : "secondary"}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {(selectedTransaction.type === "disbursement" || selectedTransaction.type === "replenishment") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTransactionToReverse(selectedTransaction)
                      setShowReverseDialog(true)
                      setSelectedTransaction(null)
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Reverse Transaction
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reverse Transaction Confirmation */}
      <ConfirmDialog
        isOpen={showReverseDialog}
        onClose={() => {
          setShowReverseDialog(false)
          setTransactionToReverse(null)
        }}
        onConfirm={handleReverseTransaction}
        title="Reverse Transaction"
        description={
          transactionToReverse ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">This will create a reverse transaction</p>
                  <p className="text-sm text-muted-foreground">
                    The amount will be {transactionToReverse.type === "disbursement" ? "returned to" : "deducted from"}{" "}
                    your fund balance.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>Original Transaction:</strong> {transactionToReverse.description}
                </p>
                <p>
                  <strong>Amount:</strong> {formatCurrency(transactionToReverse.amount)}
                </p>
                <p>
                  <strong>Type:</strong> {transactionToReverse.type}
                </p>
                {transactionToReverse.type === "disbursement" && (
                  <p className="text-sm text-muted-foreground">
                    After reversal, you'll be redirected to the disbursement page to record the corrected transaction.
                  </p>
                )}
              </div>
            </div>
          ) : null
        }
        confirmText="Reverse Transaction"
        variant="default"
        isLoading={isReversing}
      />
    </div>
  )
}
