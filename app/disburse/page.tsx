"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Minus, AlertTriangle, Receipt, User, Calendar, DollarSign, FileText, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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
  const { state, dispatch } = usePettyCash()
  const { toast } = useToast()
  const router = useRouter()

  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [purpose, setPurpose] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get custom categories from localStorage
  const customCategories = (() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("customCategories")
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
    }
    return DEFAULT_CATEGORIES
  })()

  // Validation
  const errors = {
    amount: !amount || Number.parseFloat(amount) <= 0 ? "Amount must be greater than 0" : "",
    recipient: !recipient.trim() ? "Recipient is required" : "",
    purpose: !purpose.trim() ? "Purpose is required" : "",
    category: !category ? "Category is required" : "",
    date: !date ? "Date is required" : "",
    balance: Number.parseFloat(amount) > state.balance ? "Insufficient funds" : "",
    futureDate: new Date(date) > new Date() ? "Date cannot be in the future" : "",
  }

  const hasErrors = Object.values(errors).some((error) => error !== "")
  const amountValue = Number.parseFloat(amount) || 0
  const isLargeAmount = amountValue > 500 // Warning threshold

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      dispatch({
        type: "DISBURSE",
        payload: {
          amount: amountValue,
          date,
          purpose: `${category}: ${purpose}${notes ? ` (${notes})` : ""}`,
          recipient,
        },
      })

      toast({
        title: "Disbursement Recorded",
        description: `$${amountValue.toFixed(2)} disbursed to ${recipient}`,
      })

      // Reset form
      setAmount("")
      setRecipient("")
      setPurpose("")
      setCategory("")
      setNotes("")
      setDate(new Date().toISOString().split("T")[0])

      // Navigate to dashboard after short delay
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record disbursement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
              <Link href="/initialize">
                <Button>Initialize Fund</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
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
              <strong>Current Balance:</strong> ${state.balance.toFixed(2)} available for disbursement
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

        {/* Form */}
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
                      <span>Amount *</span>
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
                      className={errors.amount || errors.balance ? "border-red-500" : ""}
                    />
                    {(errors.amount || errors.balance) && (
                      <p className="text-sm text-red-600">{errors.amount || errors.balance}</p>
                    )}
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
                        {customCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose/Description *</Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="What was this money used for?"
                    className={errors.purpose ? "border-red-500" : ""}
                  />
                  {errors.purpose && <p className="text-sm text-red-600">{errors.purpose}</p>}
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

                {/* Summary */}
                {amount && recipient && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-lg p-4"
                  >
                    <h3 className="font-medium mb-2">Transaction Summary</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Amount:</strong> ${amountValue.toFixed(2)}
                      </p>
                      <p>
                        <strong>Recipient:</strong> {recipient}
                      </p>
                      <p>
                        <strong>Category:</strong> {category}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {purpose}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Remaining Balance:</strong> ${(state.balance - amountValue).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
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
    </AppLayout>
  )
}
