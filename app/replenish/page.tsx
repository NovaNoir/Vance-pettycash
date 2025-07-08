"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLayout } from "@/components/layout/AppLayout"
import { Modal } from "@/components/ui/modal"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"

export default function ReplenishPage() {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({})

  const { state, dispatch } = usePettyCash()
  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: { amount?: string; date?: string } = {}

    if (!amount || Number.parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!date) {
      newErrors.date = "Date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      },
    })

    setShowModal(false)
    toast({
      title: "Fund Replenished",
      description: `$${Number.parseFloat(amount).toFixed(2)} added to petty cash fund`,
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Replenish Fund</h1>
          <p className="text-muted-foreground">
            Current balance: <span className="font-medium">${state.balance.toFixed(2)}</span>
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Replenishment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter replenishment amount"
                    className={errors.amount ? "border-red-500" : ""}
                  />
                  {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                </div>

                <Button type="submit" className="w-full">
                  Replenish Fund
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm Replenishment">
          <div className="space-y-4">
            <p>Are you sure you want to replenish the fund with the following amount?</p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${Number.parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>New Balance:</span>
                <span className="font-medium">${(state.balance + Number.parseFloat(amount || "0")).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmReplenishment} className="flex-1">
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}
