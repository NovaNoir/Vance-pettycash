"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { DollarSign, Zap, CheckCircle, ArrowRight, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/layout/AppLayout"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { GuidedTour } from "@/components/common/GuidedTour"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import { sanitizeAmount, validateAmount, validateDate, rateLimiter, logError } from "@/lib/security"
import Link from "next/link"

// Suggested initial amounts for quick selection
const SUGGESTED_AMOUNTS = [100, 250, 500, 1000]

// Supported currencies (for future expansion)
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
]

const tourSteps = [
  {
    target: '[data-tour="amount-input"]',
    title: "Set Initial Amount",
    content: "Enter your starting petty cash amount. You can use the suggested amounts or enter a custom value.",
    position: "bottom" as const,
  },
  {
    target: '[data-tour="suggested-amounts"]',
    title: "Quick Selection",
    content: "Click on these suggested amounts for common starting balances.",
    position: "top" as const,
  },
  {
    target: '[data-tour="initialize-button"]',
    title: "Initialize Fund",
    content: "Click here to create your petty cash fund and start tracking transactions.",
    position: "top" as const,
  },
]

export default function InitializePage() {
  const { state, dispatch } = usePettyCash()
  const { toast } = useToast()
  const router = useRouter()

  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTour, setShowTour] = useState(false)

  // Check if user wants to see the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenInitializeTour")
    if (!hasSeenTour && !state.isInitialized) {
      setShowTour(true)
    }
  }, [state.isInitialized])

  // Redirect if already initialized
  useEffect(() => {
    if (state.isInitialized) {
      router.push("/")
    }
  }, [state.isInitialized, router])

  // Real-time validation
  const amountValue = sanitizeAmount(amount)
  const validation = validateAmount(amountValue)
  const dateValidation = validateDate(date)

  const hasErrors = !validation.isValid || !dateValidation.isValid || amountValue === 0

  const handleAmountChange = (value: string) => {
    // Rate limiting for rapid input changes
    if (!rateLimiter.isAllowed("amount-input", 10, 1000)) {
      return
    }

    setAmount(value)
  }

  const handleSuggestedAmount = (suggestedAmount: number) => {
    setAmount(suggestedAmount.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: validation.error || dateValidation.error || "Please fix the errors before submitting",
        variant: "destructive",
      })
      return
    }

    // Rate limiting for form submission
    if (!rateLimiter.isAllowed("form-submit", 3, 60000)) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait a moment before trying again",
        variant: "destructive",
      })
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmInitialization = async () => {
    setIsSubmitting(true)

    try {
      // Simulate processing delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000))

      dispatch({
        type: "INITIALIZE",
        payload: {
          amount: amountValue,
          date,
        },
      })

      // Store currency preference
      localStorage.setItem("preferredCurrency", currency)

      toast({
        title: "Fund Initialized Successfully!",
        description: `Your petty cash fund has been set up with $${amountValue.toFixed(2)}`,
      })

      setShowConfirmDialog(false)

      // Navigate to dashboard after short delay
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      logError(error as Error, { amount: amountValue, date, currency })
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize fund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTourComplete = () => {
    localStorage.setItem("hasSeenInitializeTour", "true")
    setShowTour(false)
  }

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Initialize Your Petty Cash Fund</h1>
          <p className="text-muted-foreground text-lg">
            Set up your fund with an initial amount to start tracking transactions
          </p>
        </motion.div>

        {/* Info Alert */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Getting Started:</strong> Choose an appropriate starting amount based on your organization's
              typical petty cash needs. You can always replenish the fund later.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Initialization Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Fund Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Currency Selection (for future use) */}
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{selectedCurrency.symbol}</span>
                    <div>
                      <p className="font-medium">{selectedCurrency.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCurrency.code}</p>
                    </div>
                  </div>
                </div>

                {/* Suggested Amounts */}
                <div className="space-y-2" data-tour="suggested-amounts">
                  <Label>Quick Select Amount</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                      <Button
                        key={suggestedAmount}
                        type="button"
                        variant={amount === suggestedAmount.toString() ? "default" : "outline"}
                        onClick={() => handleSuggestedAmount(suggestedAmount)}
                        className="h-12 bg-transparent"
                      >
                        {selectedCurrency.symbol}
                        {suggestedAmount}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount Input */}
                  <div className="space-y-2" data-tour="amount-input">
                    <Label htmlFor="amount" className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Initial Amount *</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {selectedCurrency.symbol}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className={`pl-8 ${!validation.isValid && amount ? "border-red-500" : ""}`}
                        aria-describedby="amount-error"
                        required
                      />
                    </div>
                    {!validation.isValid && amount && (
                      <p id="amount-error" className="text-sm text-red-600" role="alert">
                        {validation.error}
                      </p>
                    )}
                    {validation.isValid && amountValue > 0 && (
                      <p className="text-sm text-green-600">
                        ✓ Valid amount: {selectedCurrency.symbol}
                        {amountValue.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Date Input */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Initialization Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className={!dateValidation.isValid ? "border-red-500" : ""}
                      aria-describedby="date-error"
                      required
                    />
                    {!dateValidation.isValid && (
                      <p id="date-error" className="text-sm text-red-600" role="alert">
                        {dateValidation.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {amountValue > 0 && validation.isValid && dateValidation.isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
                  >
                    <h3 className="font-medium mb-2 text-green-900 dark:text-green-100 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Fund Summary</span>
                    </h3>
                    <div className="text-sm space-y-1 text-green-800 dark:text-green-200">
                      <p>
                        <strong>Initial Amount:</strong> {selectedCurrency.symbol}
                        {amountValue.toFixed(2)}
                      </p>
                      <p>
                        <strong>Currency:</strong> {selectedCurrency.name} ({selectedCurrency.code})
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(date).toLocaleDateString()}
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
                    className="flex-1"
                    data-tour="initialize-button"
                  >
                    {isSubmitting ? "Initializing..." : "Initialize Fund"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTour(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Need help? Take a quick tour
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmInitialization}
          title="Initialize Petty Cash Fund"
          description={`Are you sure you want to initialize your petty cash fund with ${selectedCurrency.symbol}${amountValue.toFixed(2)}? This will create your fund and you can start recording transactions.`}
          confirmText="Initialize Fund"
          variant="success"
          isLoading={isSubmitting}
        />

        {/* Guided Tour */}
        <GuidedTour
          steps={tourSteps}
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onComplete={handleTourComplete}
        />
      </div>
    </AppLayout>
  )
}
