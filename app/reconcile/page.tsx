"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/layout/AppLayout"
import { usePettyCash } from "@/contexts/PettyCashContext"

export default function ReconcilePage() {
  const { state } = usePettyCash()
  const [actualCash, setActualCash] = useState("")
  const [hasReconciled, setHasReconciled] = useState(false)
  const [error, setError] = useState("")

  const handleReconcile = () => {
    const actualAmount = Number.parseFloat(actualCash)

    if (isNaN(actualAmount) || actualAmount < 0) {
      setError("Please enter a valid amount")
      return
    }

    setError("")
    setHasReconciled(true)
  }

  const actualAmount = Number.parseFloat(actualCash) || 0
  const theoreticalBalance = state.balance
  const discrepancy = actualAmount - theoreticalBalance
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01 // Account for floating point precision

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
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Reconcile Cash</h1>
          <p className="text-muted-foreground">Compare actual cash on hand with the theoretical balance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Theoretical Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">${theoreticalBalance.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-2">Based on recorded transactions</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Actual Cash Count</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="actualCash">Cash on Hand ($)</Label>
                  <Input
                    id="actualCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="Enter actual cash amount"
                    className={error ? "border-red-500" : ""}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <Button onClick={handleReconcile} className="w-full">
                  Reconcile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {hasReconciled && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {hasDiscrepancy ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span>Discrepancy Found</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Perfect Match</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-sm text-muted-foreground">Theoretical</div>
                    <div className="text-xl font-bold text-blue-600">${theoreticalBalance.toFixed(2)}</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-sm text-muted-foreground">Actual</div>
                    <div className="text-xl font-bold text-green-600">${actualAmount.toFixed(2)}</div>
                  </div>

                  <div
                    className={`text-center p-4 rounded-lg ${
                      hasDiscrepancy ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"
                    }`}
                  >
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div
                      className={`text-xl font-bold ${
                        hasDiscrepancy ? (discrepancy > 0 ? "text-green-600" : "text-red-600") : "text-green-600"
                      }`}
                    >
                      {discrepancy > 0 ? "+" : ""}${discrepancy.toFixed(2)}
                    </div>
                  </div>
                </div>

                {hasDiscrepancy && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {discrepancy > 0 ? (
                        <>
                          <strong>Overage:</strong> You have ${Math.abs(discrepancy).toFixed(2)} more cash than
                          expected. This could indicate an unrecorded replenishment or error in disbursement recording.
                        </>
                      ) : (
                        <>
                          <strong>Shortage:</strong> You have ${Math.abs(discrepancy).toFixed(2)} less cash than
                          expected. This could indicate an unrecorded disbursement or error in transaction recording.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {!hasDiscrepancy && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Perfect! Your actual cash matches the theoretical balance exactly. Your petty cash fund is
                      properly reconciled.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Reconciliation Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reconciliation Time:</span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${hasDiscrepancy ? "text-yellow-600" : "text-green-600"}`}>
                      {hasDiscrepancy ? "Discrepancy Found" : "Reconciled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-medium">{state.transactions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
