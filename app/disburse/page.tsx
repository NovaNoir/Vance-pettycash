"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Minus,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
  Plus,
  Calculator,
  Upload,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { formatCurrency, validateAmount, sanitizeInput } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface TransactionCost {
  id: string
  description: string
  amount: number
  category: string
}

const DEFAULT_CATEGORIES = [
  "Office Supplies",
  "Transportation",
  "Postage & Shipping",
  "Cleaning Supplies",
  "Minor Repairs",
  "Refreshments",
  "Stationery",
  "Utilities",
  "Emergency Expenses",
  "Other",
]

export default function DisbursePage() {
  const { state, addTransaction } = usePettyCash()
  const { hideAmounts } = usePrivacy()
  const router = useRouter()

  // Main transaction fields
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Transaction costs
  const [transactionCosts, setTransactionCosts] = useState<TransactionCost[]>([])
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [newCostDescription, setNewCostDescription] = useState("")
  const [newCostAmount, setNewCostAmount] = useState("")
  const [newCostCategory, setNewCostCategory] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate totals
  const mainAmount = Number.parseFloat(amount) || 0
  const costsTotal = transactionCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const totalAmount = mainAmount + costsTotal

  // Validation
  const errors = {
    amount: !amount || mainAmount <= 0 ? "Amount must be greater than 0" : "",
    recipient: !recipient.trim() ? "Recipient is required" : "",
    description: !description.trim() ? "Description is required" : "",
    category: !category ? "Category is required" : "",
    date: !date ? "Date is required" : "",
    balance: totalAmount > state.balance ? "Insufficient funds" : "",
    futureDate: new Date(date) > new Date() ? "Date cannot be in the future" : "",
  }

  const hasErrors = Object.values(errors).some((error) => error !== "")
  const isLargeAmount = totalAmount > 500

  // Add transaction cost
  const addTransactionCost = () => {
    if (!newCostDescription.trim() || !newCostAmount || !newCostCategory) {
      toast.error("Please fill in all cost fields")
      return
    }

    const costAmount = Number.parseFloat(newCostAmount)
    if (!validateAmount(costAmount) || costAmount <= 0) {
      toast.error("Invalid cost amount")
      return
    }

    const newCost: TransactionCost = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: sanitizeInput(newCostDescription),
      amount: costAmount,
      category: newCostCategory,
    }

    setTransactionCosts([...transactionCosts, newCost])
    setNewCostDescription("")
    setNewCostAmount("")
    setNewCostCategory("")
    toast.success("Transaction cost added")
  }

  // Remove transaction cost
  const removeTransactionCost = (id: string) => {
    setTransactionCosts(transactionCosts.filter((cost) => cost.id !== id))
    toast.success("Transaction cost removed")
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image or PDF file")
        return
      }

      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB")
        return
      }

      setReceiptFile(file)
      toast.success("Receipt uploaded successfully")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasErrors) {
      toast.error("Please fix the errors before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      // Create the main transaction
      const transactionDescription =
        showCostBreakdown && transactionCosts.length > 0
          ? `${description} (with ${transactionCosts.length} additional costs)`
          : description

      const transaction = {
        type: "disbursement" as const,
        amount: totalAmount,
        description: transactionDescription,
        category,
        recipient,
        status: "approved" as const,
      }

      addTransaction(transaction)

      // Store transaction costs for reporting
      if (transactionCosts.length > 0) {
        const costsData = {
          transactionId: `${Date.now()}`,
          costs: transactionCosts,
          totalCosts: costsTotal,
        }
        localStorage.setItem(`transaction_costs_${Date.now()}`, JSON.stringify(costsData))
      }

      // Store receipt file reference (in a real app, you'd upload to a server)
      if (receiptFile) {
        const receiptData = {
          transactionId: `${Date.now()}`,
          fileName: receiptFile.name,
          fileSize: receiptFile.size,
          fileType: receiptFile.type,
        }
        localStorage.setItem(`receipt_${Date.now()}`, JSON.stringify(receiptData))
      }

      toast.success(`Disbursement recorded: ${formatCurrency(totalAmount)}`)

      // Reset form
      setAmount("")
      setRecipient("")
      setDescription("")
      setCategory("")
      setNotes("")
      setTransactionCosts([])
      setReceiptFile(null)
      setDate(new Date().toISOString().split("T")[0])

      // Navigate back to dashboard
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      toast.error("Failed to record disbursement. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
            <Link href="/initialize">
              <Button>Initialize Fund</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Minus className="h-8 w-8 text-red-600" />
            <span>Record Disbursement</span>
          </h1>
          <p className="text-muted-foreground">Record money going out of the petty cash fund</p>
        </div>
      </div>

      {/* Current Balance Alert */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Current Balance:</strong> {formatCurrency(state.balance, "USD", hideAmounts)} available for
            disbursement
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Large Amount Warning */}
      {isLargeAmount && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Large Amount:</strong> This disbursement exceeds $500. Please ensure proper authorization.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5" />
                  <span>Disbursement Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Main Amount *</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={state.balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={errors.amount ? "border-red-500" : ""}
                      />
                      {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date *</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className={errors.date || errors.futureDate ? "border-red-500" : ""}
                      />
                      {(errors.date || errors.futureDate) && (
                        <p className="text-sm text-red-600">{errors.date || errors.futureDate}</p>
                      )}
                    </div>

                    {/* Recipient */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Recipient *</span>
                      </Label>
                      <Input
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="Who received the money?"
                        className={errors.recipient ? "border-red-500" : ""}
                      />
                      {errors.recipient && <p className="text-sm text-red-600">{errors.recipient}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Category *</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this money used for?"
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Receipt (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      {receiptFile && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{receiptFile.name}</Badge>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details or notes..."
                      rows={3}
                    />
                  </div>

                  {/* Transaction Costs Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch id="cost-breakdown" checked={showCostBreakdown} onCheckedChange={setShowCostBreakdown} />
                    <Label htmlFor="cost-breakdown" className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4" />
                      <span>Add transaction cost breakdown</span>
                    </Label>
                  </div>

                  {/* Transaction Costs Section */}
                  {showCostBreakdown && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-lg">Transaction Cost Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Existing Costs */}
                        {transactionCosts.length > 0 && (
                          <div className="space-y-2">
                            {transactionCosts.map((cost) => (
                              <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{cost.description}</p>
                                  <p className="text-sm text-muted-foreground">{cost.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {formatCurrency(cost.amount, "USD", hideAmounts)}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTransactionCost(cost.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Separator />
                          </div>
                        )}

                        {/* Add New Cost */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input
                            placeholder="Cost description"
                            value={newCostDescription}
                            onChange={(e) => setNewCostDescription(e.target.value)}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={newCostAmount}
                            onChange={(e) => setNewCostAmount(e.target.value)}
                          />
                          <Select value={newCostCategory} onValueChange={setNewCostCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEFAULT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={addTransactionCost}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Cost
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-4 pt-4">
                    <Link href="/" className="flex-1">
                      <Button type="button" variant="outline" className="w-full bg-transparent">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={hasErrors || isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? "Recording..." : "Record Disbursement"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {amount && recipient && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Main Amount:</span>
                        <span className="font-semibold">{formatCurrency(mainAmount, "USD", hideAmounts)}</span>
                      </div>

                      {transactionCosts.length > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span>Additional Costs:</span>
                            <span className="font-semibold">{formatCurrency(costsTotal, "USD", hideAmounts)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total Amount:</span>
                            <span className="font-bold">{formatCurrency(totalAmount, "USD", hideAmounts)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between">
                        <span>Recipient:</span>
                        <span className="font-medium">{recipient}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Category:</span>
                        <Badge variant="secondary">{category}</Badge>
                      </div>

                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(date).toLocaleDateString()}</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between">
                        <span>Remaining Balance:</span>
                        <span
                          className={`font-semibold ${(state.balance - totalAmount) < state.settings.lowBalanceThreshold ? "text-red-600" : ""}`}
                        >
                          {formatCurrency(state.balance - totalAmount, "USD", hideAmounts)}
                        </span>
                      </div>
                    </div>

                    {receiptFile && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Receipt attached</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{receiptFile.name}</p>
                      </div>
                    )}

                    {errors.balance && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{errors.balance}</AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {(!amount || !recipient) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Fill in the amount and recipient to see the summary
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
