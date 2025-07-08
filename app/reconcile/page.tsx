"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, AlertTriangle, CheckCircle, XCircle, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"

interface ReconciliationRecord {
  id: string
  date: string
  theoreticalBalance: number
  actualCash: number
  difference: number
  explanation?: string
  timestamp: number
}

export default function ReconcilePage() {
  const { state } = usePettyCash()
  const { toast } = useToast()

  const [actualCash, setActualCash] = useState("")
  const [explanation, setExplanation] = useState("")
  const [hasReconciled, setHasReconciled] = useState(false)
  const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationRecord[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reconciliationHistory")
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const actualAmount = Number.parseFloat(actualCash) || 0
  const difference = actualAmount - state.balance
  const isDifferenceSignificant = Math.abs(difference) > 0.01

  const handleReconcile = () => {
    if (!actualCash || isNaN(actualAmount)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid cash amount",
        variant: "destructive",
      })
      return
    }

    const reconciliation: ReconciliationRecord = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      theoreticalBalance: state.balance,
      actualCash: actualAmount,
      difference,
      explanation: explanation.trim() || undefined,
      timestamp: Date.now(),
    }

    const updatedHistory = [reconciliation, ...reconciliationHistory].slice(0, 10) // Keep last 10 records
    setReconciliationHistory(updatedHistory)

    // Save to localStorage
    localStorage.setItem("reconciliationHistory", JSON.stringify(updatedHistory))

    setHasReconciled(true)

    toast({
      title: "Reconciliation Complete",
      description: isDifferenceSignificant
        ? `Discrepancy of $${Math.abs(difference).toFixed(2)} recorded`
        : "Cash count matches theoretical balance",
      variant: isDifferenceSignificant ? "destructive" : "default",
    })
  }

  const resetForm = () => {
    setActualCash("")
    setExplanation("")
    setHasReconciled(false)
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Cash Reconciliation</h1>
          <p className="text-muted-foreground">Compare actual cash on hand with the theoretical balance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reconciliation Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Current Reconciliation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theoretical Balance */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Theoretical Balance</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${state.balance.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Based on recorded transactions</p>
                </div>

                {/* Actual Cash Input */}
                <div className="space-y-2">
                  <Label htmlFor="actualCash">Actual Cash on Hand ($)</Label>
                  <Input
                    id="actualCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="Enter actual cash amount"
                    disabled={hasReconciled}
                  />
                </div>

                {/* Difference Display */}
                {actualCash && !isNaN(actualAmount) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-lg ${
                      isDifferenceSignificant
                        ? difference > 0
                          ? "bg-yellow-50 dark:bg-yellow-950"
                          : "bg-red-50 dark:bg-red-950"
                        : "bg-green-50 dark:bg-green-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isDifferenceSignificant ? (
                          difference > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <span className="font-medium">
                          {isDifferenceSignificant ? (difference > 0 ? "Overage" : "Shortage") : "Balanced"}
                        </span>
                      </div>
                      <span
                        className={`text-xl font-bold ${
                          isDifferenceSignificant
                            ? difference > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {difference > 0 ? "+" : ""}${difference.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Explanation Field */}
                {actualCash && isDifferenceSignificant && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <Label htmlFor="explanation">Explanation for Discrepancy {isDifferenceSignificant && "*"}</Label>
                    <Textarea
                      id="explanation"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Please explain the reason for this discrepancy..."
                      disabled={hasReconciled}
                    />
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {!hasReconciled ? (
                    <Button onClick={handleReconcile} disabled={!actualCash || isNaN(actualAmount)} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Complete Reconciliation
                    </Button>
                  ) : (
                    <Button onClick={resetForm} variant="outline" className="flex-1 bg-transparent">
                      New Reconciliation
                    </Button>
                  )}
                </div>

                {/* Success Message */}
                {hasReconciled && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Reconciliation completed and saved to history.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Reconciliation History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation History</CardTitle>
              </CardHeader>
              <CardContent>
                {reconciliationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reconciliation records yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reconciliationHistory.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                          <Badge
                            variant={
                              Math.abs(record.difference) < 0.01
                                ? "default"
                                : record.difference > 0
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {Math.abs(record.difference) < 0.01
                              ? "Balanced"
                              : record.difference > 0
                                ? "Overage"
                                : "Shortage"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Theoretical:</span>
                            <div className="font-medium">${record.theoreticalBalance.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actual:</span>
                            <div className="font-medium">${record.actualCash.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Difference:</span>
                          <span
                            className={`ml-2 font-medium ${
                              Math.abs(record.difference) < 0.01
                                ? "text-green-600"
                                : record.difference > 0
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {record.difference > 0 ? "+" : ""}${record.difference.toFixed(2)}
                          </span>
                        </div>

                        {record.explanation && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Explanation:</span>
                            <div className="mt-1 text-sm bg-muted p-2 rounded">{record.explanation}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
