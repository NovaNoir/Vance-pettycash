"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings, Trash2, AlertTriangle, Download, Upload, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { Modal } from "@/components/ui/modal"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"

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

export default function SettingsPage() {
  const { state, dispatch } = usePettyCash()
  const { toast } = useToast()

  const [showResetModal, setShowResetModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState("")
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lowBalanceThreshold") || "100"
    }
    return "100"
  })
  const [customCategories, setCustomCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("customCategories")
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
    }
    return DEFAULT_CATEGORIES
  })
  const [newCategory, setNewCategory] = useState("")

  const handleResetFund = () => {
    if (resetConfirmation !== "RESET") {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'RESET' to confirm",
        variant: "destructive",
      })
      return
    }

    // Clear all data
    localStorage.removeItem("pettyCashData")
    localStorage.removeItem("reconciliationHistory")

    // Reset state
    dispatch({ type: "RESET_FUND" })

    setShowResetModal(false)
    setResetConfirmation("")

    toast({
      title: "Fund Reset Complete",
      description: "All data has been cleared. You can now initialize a new fund.",
    })
  }

  const handleExportData = () => {
    const exportData = {
      fundData: state,
      reconciliationHistory: JSON.parse(localStorage.getItem("reconciliationHistory") || "[]"),
      settings: {
        lowBalanceThreshold,
        customCategories,
      },
      exportDate: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `petty-cash-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setShowExportModal(false)
    toast({
      title: "Data Exported",
      description: "Your petty cash data has been exported successfully.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)

        if (importData.fundData) {
          localStorage.setItem("pettyCashData", JSON.stringify(importData.fundData))
          dispatch({ type: "LOAD_FROM_STORAGE", payload: importData.fundData })
        }

        if (importData.reconciliationHistory) {
          localStorage.setItem("reconciliationHistory", JSON.stringify(importData.reconciliationHistory))
        }

        if (importData.settings) {
          if (importData.settings.lowBalanceThreshold) {
            setLowBalanceThreshold(importData.settings.lowBalanceThreshold)
            localStorage.setItem("lowBalanceThreshold", importData.settings.lowBalanceThreshold)
          }
          if (importData.settings.customCategories) {
            setCustomCategories(importData.settings.customCategories)
            localStorage.setItem("customCategories", JSON.stringify(importData.settings.customCategories))
          }
        }

        toast({
          title: "Data Imported",
          description: "Your petty cash data has been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please select a valid backup file.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleSaveSettings = () => {
    localStorage.setItem("lowBalanceThreshold", lowBalanceThreshold)
    localStorage.setItem("customCategories", JSON.stringify(customCategories))

    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully.",
    })
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) return

    if (customCategories.includes(newCategory.trim())) {
      toast({
        title: "Category Exists",
        description: "This category already exists.",
        variant: "destructive",
      })
      return
    }

    const updatedCategories = [...customCategories.filter((cat) => cat !== "Other"), newCategory.trim(), "Other"]
    setCustomCategories(updatedCategories)
    setNewCategory("")
  }

  const handleRemoveCategory = (categoryToRemove: string) => {
    if (categoryToRemove === "Other") {
      toast({
        title: "Cannot Remove",
        description: "The 'Other' category cannot be removed.",
        variant: "destructive",
      })
      return
    }

    setCustomCategories(customCategories.filter((cat) => cat !== categoryToRemove))
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your petty cash system preferences and data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>General Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Balance Alert Threshold ($)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    You'll receive alerts when the balance falls below this amount
                  </p>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button onClick={() => setShowExportModal(true)} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <p className="text-sm text-muted-foreground">Download a backup of all your data</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-file" className="cursor-pointer">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </span>
                    </Button>
                  </Label>
                  <input id="import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  <p className="text-sm text-muted-foreground">Restore data from a backup file</p>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => setShowResetModal(true)}
                    variant="destructive"
                    className="w-full"
                    disabled={!state.isInitialized}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset Fund
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">Permanently delete all data and start fresh</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Custom Categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Disbursement Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {customCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="flex items-center space-x-2 px-3 py-1">
                    <span>{category}</span>
                    {category !== "Other" && (
                      <button
                        onClick={() => handleRemoveCategory(category)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add new category"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Information */}
        {state.isInitialized && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fund Initialized:</span>
                    <div className="font-medium">
                      {state.transactions.find((t) => t.type === "initialization")?.date
                        ? new Date(
                            state.transactions.find((t) => t.type === "initialization")!.date,
                          ).toLocaleDateString()
                        : "Unknown"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Transactions:</span>
                    <div className="font-medium">{state.transactions.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Balance:</span>
                    <div className="font-medium">${state.balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Transaction:</span>
                    <div className="font-medium">
                      {state.transactions.length > 0
                        ? new Date(state.transactions[state.transactions.length - 1].date).toLocaleDateString()
                        : "None"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reset Confirmation Modal */}
        <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Petty Cash Fund">
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This action will permanently delete all transactions, reconciliation history,
                and reset your fund. This cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="reset-confirmation">
                Type <strong>RESET</strong> to confirm:
              </Label>
              <Input
                id="reset-confirmation"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="Type RESET here"
              />
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setShowResetModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetFund}
                disabled={resetConfirmation !== "RESET"}
                className="flex-1"
              >
                Reset Fund
              </Button>
            </div>
          </div>
        </Modal>

        {/* Export Confirmation Modal */}
        <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Data">
          <div className="space-y-4">
            <p>This will download a JSON file containing:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>All transaction data</li>
              <li>Reconciliation history</li>
              <li>System settings</li>
              <li>Custom categories</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Keep this file safe as it contains all your petty cash data.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setShowExportModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleExportData} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}
