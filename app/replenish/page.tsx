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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/layout/AppLayout"
import { Modal } from "@/components/ui/modal"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import { Plus, AlertTriangle } from "lucide-react"

// Predefined replenishment sources
const REPLENISHMENT_SOURCES = [
  "Bank Transfer",
  "Cash from Main Account",
  "Cheque",
  "Credit Card",
  "Petty Cash Voucher",
  "Other",
]

export default function ReplenishPage() {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [source, setSource] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<{
    amount?: string
    date?: string
    source?: string
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
    } else if (amountValue > 10000) {
      newErrors.amount = "Amount cannot exceed $10,000 for security reasons"
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

    // Source validation
    if (!source) {
      newErrors.source = "Please select a replenishment source"
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
      if (amountValue > 10000) {
        setErrors((prev) => ({
          ...prev,
          amount: "Amount cannot exceed $10,000 for security reasons",
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

  const confirmReplenishment = () => {
    dispatch({
      type: "REPLENISH",
      payload: {
        amount: Number.parseFloat(amount),
        date,
        source,
      },
    })

    setShowModal(false)
    toast({
      title: "Fund Replenished",
      description: `$${Number.parseFloat(amount).toFixed(2)} added from ${source}`,
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

  const newBalance = state.balance + (Number.parseFloat(amount) || 0)
  const isLargeReplenishment = Number.parseFloat(amount) > 1000

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Replenish Fund</h1>
          <p className="text-muted-foreground">
            Current balance: <span className="font-medium">${state.balance.toFixed(2)}</span>
          </p>
        </div>

        {/* Large Replenishment Warning */}
        {isLargeReplenishment && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Large Replenishment:</strong> This is a significant amount. Please ensure proper authorization and
              documentation are in place.
            </AlertDescription>
          </Alert>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Replenishment Details</span>
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
                      max="10000"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className={errors.amount ? "border-red-500" : ""}
                    />
                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                    {amount && !errors.amount && (
                      <p className="text-sm text-muted-foreground">New balance: ${newBalance.toFixed(2)}</p>
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
                  <Label htmlFor="source">Replenishment Source *</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className={errors.source ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select replenishment source" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPLENISHMENT_SOURCES.map((src) => (
                        <SelectItem key={src} value={src}>
                          {src}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source && <p className="text-sm text-red-500">{errors.source}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={Object.keys(errors).length > 0}>
                  Replenish Fund
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm Replenishment">
          <div className="space-y-4">
            <p>Please review and confirm this replenishment:</p>
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
                <span>Source:</span>
                <span className="font-medium">{source}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-medium">${state.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>New Balance:</span>
                <span className="text-green-600">${newBalance.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmReplenishment} className="flex-1">
                Confirm Replenishment
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}
