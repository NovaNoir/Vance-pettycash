"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Plus, DollarSign, Calendar, Building, FileText, ArrowLeft, TrendingUp } from "lucide-react"
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

const REPLENISHMENT_SOURCES = [
  "Petty Cash Account",
  "Operating Account",
  "Main Bank Account",
  "Cash Advance",
  "Expense Reimbursement",
  "Other",
]

export default function ReplenishPage() {
  const { state, dispatch } = usePettyCash()
  const { toast } = useToast()
  const router = useRouter()

  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation
  const errors = {
    amount: !amount || Number.parseFloat(amount) <= 0 ? "Amount must be greater than 0" : "",
    source: !source ? "Source is required" : "",
    date: !date ? "Date is required" : "",
    futureDate: new Date(date) > new Date() ? "Date cannot be in the future" : "",
  }

  const hasErrors = Object.values(errors).some((error) => error !== "")
  const amountValue = Number.parseFloat(amount) || 0

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
        type: "REPLENISH",
        payload: {
          amount: amountValue,
          date,
          source,
        },
      })

      toast({
        title: "Fund Replenished",
        description: `$${amountValue.toFixed(2)} added from ${source}`,
      })

      // Reset form
      setAmount("")
      setSource("")
      setNotes("")
      setDate(new Date().toISOString().split("T")[0])

      // Navigate to dashboard after short delay
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record replenishment. Please try again.",
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
              <Plus className="h-8 w-8 text-green-600" />
              <span>Replenish Fund</span>
            </h1>
            <p className="text-muted-foreground">Add money to your petty cash fund</p>
          </div>
        </div>

        {/* Current Balance Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Current Balance:</strong> ${state.balance.toFixed(2)} • Adding funds will increase your available
              balance
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Replenishment Details</span>
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

                  {/* Source */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="source" className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Funding Source *</span>
                    </Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className={errors.source ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select funding source" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPLENISHMENT_SOURCES.map((src) => (
                          <SelectItem key={src} value={src}>
                            {src}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.source && <p className="text-sm text-red-600">{errors.source}</p>}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Notes (Optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional details about this replenishment..."
                    rows={3}
                  />
                </div>

                {/* Summary */}
                {amount && source && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
                  >
                    <h3 className="font-medium mb-2 text-green-900 dark:text-green-100">Replenishment Summary</h3>
                    <div className="text-sm space-y-1 text-green-800 dark:text-green-200">
                      <p>
                        <strong>Amount:</strong> ${amountValue.toFixed(2)}
                      </p>
                      <p>
                        <strong>Source:</strong> {source}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Current Balance:</strong> ${state.balance.toFixed(2)}
                      </p>
                      <p>
                        <strong>New Balance:</strong> ${(state.balance + amountValue).toFixed(2)}
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Processing..." : "Replenish Fund"}
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
