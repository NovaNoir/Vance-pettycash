"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Scale, CheckCircle, AlertTriangle, Calculator, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"

interface ReconciliationRecord {
  id: string
  date: string
  systemBalance: number
  physicalBalance: number
  difference: number
  notes?: string
  timestamp: number
}

export default function ReconcilePage() {
  const { state } = usePettyCash()
  const { toast } = useToast()

  const [physicalBalance, setPhysicalBalance] = useState("")
  const [notes, setNotes] = useState("")
  const [isReconciling, setIsReconciling] = useState(false)
  const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationRecord[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reconciliationHistory")
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const reconciliationData = useMemo(() => {
    const physicalAmount = Number.parseFloat(physicalBalance) || 0
    const difference = physicalAmount - state.balance
    const isBalanced = Math.abs(difference) < 0.01 // Allow for small rounding differences

    return {
      systemBalance: state.balance,
      physicalBalance: physicalAmount,
      difference,
      isBalanced,
      hasPhysicalInput: physicalBalance !== "",
    }
  }, [state.balance, physicalBalance])

  const handleReconcile = async () => {
    if (!reconciliationData.hasPhysicalInput) {
      toast({
        title: "Missing Information",
        description: "Please enter the physical cash count",
        variant: "destructive",
      })
      return
    }

    setIsReconciling(true)

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const reconciliationRecord: ReconciliationRecord = {
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString().split("T")[0],
        systemBalance: reconciliationData.systemBalance,
        physicalBalance: reconciliationData.physicalBalance,
        difference: reconciliationData.difference,
        notes,
        timestamp: Date.now(),
      }

      const updatedHistory = [reconciliationRecord, ...reconciliationHistory]
      setReconciliationHistory(updatedHistory)
      localStorage.setItem("reconciliationHistory", JSON.stringify(updatedHistory))

      toast({
        title: reconciliationData.isBalanced ? "Reconciliation Complete" : "Discrepancy Recorded",
        description: reconciliationData.isBalanced
          ? "Your cash count matches the system balance"
          : `Discrepancy of $${Math.abs(reconciliationData.difference).toFixed(2)} has been recorded`,
        variant: reconciliationData.isBalanced ? "default" : "destructive",
      })

      // Reset form
      setPhysicalBalance("")
      setNotes("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete reconciliation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReconciling(false)
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
          <h1 className="text-3xl font-bold">Reconcile Cash</h1>
          <p className="text-muted-foreground">
            Compare your physical cash count with the system balance to ensure accuracy
          </p>
        </div>

        {/* Current System Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Calculator className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>System Balance:</strong> ${state.balance.toFixed(2)} based on {state.transactions.length} recorded
              transactions
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Reconciliation Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="h-5 w-5" />
                <span>Cash Count Reconciliation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="systemBalance">System Balance</Label>
                  <Input id="systemBalance" value={`$${state.balance.toFixed(2)}`} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">Calculated from transaction history</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicalBalance">Physical Cash Count *</Label>
                  <Input
                    id="physicalBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={physicalBalance}
                    onChange={(e) => setPhysicalBalance(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">Count all physical cash and enter the total</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations or explanations for discrepancies..."
                />
              </div>

              {/* Reconciliation Summary */}
              {reconciliationData.hasPhysicalInput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-4 border ${
                    reconciliationData.isBalanced
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    {reconciliationData.isBalanced ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <h3
                      className={`font-medium ${
                        reconciliationData.isBalanced
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      {reconciliationData.isBalanced ? "Balanced" : "Discrepancy Detected"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">System:</span>
                      <p className="font-semibold">${reconciliationData.systemBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Physical:</span>
                      <p className="font-semibold">${reconciliationData.physicalBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Difference:</span>
                      <p
                        className={`font-semibold ${
                          reconciliationData.difference === 0
                            ? "text-green-600"
                            : reconciliationData.difference > 0
                              ? "text-green-600"
                              : "text-red-600"
                        }`}
                      >
                        {reconciliationData.difference >= 0 ? "+" : ""}${reconciliationData.difference.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!reconciliationData.isBalanced && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                      {reconciliationData.difference > 0
                        ? "Physical cash exceeds system balance. Check for unrecorded replenishments."
                        : "Physical cash is less than system balance. Check for unrecorded disbursements or missing cash."}
                    </p>
                  )}
                </motion.div>
              )}

              <Button
                onClick={handleReconcile}
                disabled={!reconciliationData.hasPhysicalInput || isReconciling}
                className="w-full"
              >
                {isReconciling ? "Recording Reconciliation..." : "Complete Reconciliation"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reconciliation History */}
        {reconciliationHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Reconciliation History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reconciliationHistory.slice(0, 10).map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        <Badge
                          variant={Math.abs(record.difference) < 0.01 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {Math.abs(record.difference) < 0.01 ? "Balanced" : "Discrepancy"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          System: ${record.systemBalance.toFixed(2)} | Physical: ${record.physicalBalance.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            Math.abs(record.difference) < 0.01
                              ? "text-green-600"
                              : record.difference > 0
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          Difference: {record.difference >= 0 ? "+" : ""}${record.difference.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
