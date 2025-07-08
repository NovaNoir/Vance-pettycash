"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/layout/AppLayout"
import { Modal } from "@/components/ui/modal"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, DollarSign } from "lucide-react"

// Predefined disbursement categories
const DISBURSEMENT_CATEGORIES = [
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
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState("")
  const [customPurpose, setCustomPurpose] = useState("")
  const [recipient, setRecipient] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<{
    amount?: string
    date?: string
    category?: string
    customPurpose?: string
    recipient?: string
  }>({})

  const { state, dispatch } = usePettyCash()
  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: typeof errors = {}
    const amountValue = Number.parseFloat(amount)

    // Amount validation
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0"
    } else if (amountValue > state.balance) {
      newErrors.amount = `Amount cannot exceed current balance ($${state.balance.toFixed(2)})`
    }

    // Date validation
    if (!date) {
      newErrors.date = "Date is required"
    } else {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future"
      }
    }

    // Category validation
    if (!category) {
      newErrors.category = "Please select a category"
    }

    // Custom purpose validation (only if "Other" is selected)
    if (category === "Other" && !customPurpose.trim()) {
      newErrors.customPurpose = "Please specify the purpose when selecting 'Other'"
    }

    // Recipient validation
    if (!recipient.trim()) {
      newErrors.recipient = "Recipient name is required"
    } else if (recipient.trim().length < 2) {
      newErrors.recipient = "Recipient name must be at least 2 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)

    // Real-time validation for amount
    if (value && !isNaN(Number.parseFloat(value))) {
      const amountValue = Number.parseFloat(value)
      if (amountValue > state.balance) {
        setErrors((prev) => ({
          ...prev,
          amount: `Amount cannot exceed current balance ($${state.balance.toFixed(2)})`,
        }))
      } else {
        setErrors((prev) => ({ ...prev, amount: undefined }))
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setShowModal(true)
  }

  const confirmDisbursement = () => {
    const purpose = category === "Other" ? customPurpose.trim() : category

    dispatch({
      type: "DISBURSE",
      payload: {
        amount: Number.parseFloat(amount),
        date,
        purpose,
        recipient: recipient.trim(),
      },
    })

    setShowModal(false)
    toast({
      title: "Disbursement Recorded",
      description: `$${Number.parseFloat(amount).toFixed(2)} disbursed to ${recipient.trim()}`,
    })
    router.push("/")
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
              <Button onClick={() => router.push("/initialize")}>Initialize Fund</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const remainingBalance = state.balance - (Number.parseFloat(amount) || 0)
  const isLowBalance = state.balance < 100

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Record Disbursement</h1>
          <p className="text-muted-foreground">
            Current balance: <span className="font-medium">${state.balance.toFixed(2)}</span>
          </p>
        </div>

        {/* Low Balance Warning */}
        {isLowBalance && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Low Balance:</strong> Consider replenishing the fund soon to avoid running out of cash.
            </AlertDescription>
          </Alert>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Disbursement Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={state.balance}
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className={errors.amount ? "border-red-500" : ""}
                    />
                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                    {amount && !errors.amount && (
                      <p className="text-sm text-muted-foreground">Remaining balance: ${remainingBalance.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className={errors.date ? "border-red-500" : ""}
                    />
                    {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient *</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient name"
                    className={errors.recipient ? "border-red-500" : ""}
                  />
                  {errors.recipient && <p className="text-sm text-red-500">{errors.recipient}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISBURSEMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>

                {category === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customPurpose">Specify Purpose *</Label>
                    <Textarea
                      id="customPurpose"
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="Please specify the purpose of this disbursement"
                      className={errors.customPurpose ? "border-red-500" : ""}
                    />
                    {errors.customPurpose && <p className="text-sm text-red-500">{errors.customPurpose}</p>}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={Object.keys(errors).length > 0}>
                  Record Disbursement
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm Disbursement">
          <div className="space-y-4">
            <p>Please review and confirm this disbursement:</p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${Number.parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Recipient:</span>
                <span className="font-medium">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">{category}</span>
              </div>
              {category === "Other" && (
                <div className="flex justify-between">
                  <span>Purpose:</span>
                  <span className="font-medium">{customPurpose}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>New Balance:</span>
                <span className={remainingBalance < 50 ? "text-red-600" : ""}>${remainingBalance.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmDisbursement} className="flex-1">
                Confirm Disbursement
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}
