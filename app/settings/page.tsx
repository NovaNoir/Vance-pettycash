"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  Save,
  Plus,
  X,
  Shield,
  Database,
  Palette,
  Bell,
  HelpCircle,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/layout/AppLayout"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { usePettyCash } from "@/contexts/PettyCashContext"
import { useToast } from "@/hooks/use-toast"
import { validateAmount, sanitizeInput, rateLimiter } from "@/lib/security"

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

interface SettingsState {
  lowBalanceThreshold: string
  customCategories: string[]
  notifications: {
    lowBalance: boolean
    transactions: boolean
    reconciliation: boolean
  }
  appearance: {
    compactMode: boolean
    showAnimations: boolean
  }
}

export default function SettingsPage() {
  const { state, dispatch } = usePettyCash()
  const { toast } = useToast()

  // Modal states
  const [showResetModal, setShowResetModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Form states
  const [resetConfirmation, setResetConfirmation] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    lowBalanceThreshold: "100",
    customCategories: DEFAULT_CATEGORIES,
    notifications: {
      lowBalance: true,
      transactions: false,
      reconciliation: true,
    },
    appearance: {
      compactMode: false,
      showAnimations: true,
    },
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedThreshold = localStorage.getItem("lowBalanceThreshold") || "100"
      const storedCategories = localStorage.getItem("customCategories")
      const storedNotifications = localStorage.getItem("notificationSettings")
      const storedAppearance = localStorage.getItem("appearanceSettings")

      setSettings((prev) => ({
        ...prev,
        lowBalanceThreshold: storedThreshold,
        customCategories: storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORIES,
        notifications: storedNotifications ? JSON.parse(storedNotifications) : prev.notifications,
        appearance: storedAppearance ? JSON.parse(storedAppearance) : prev.appearance,
      }))
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast({
        title: "Settings Load Error",
        description: "Some settings could not be loaded. Using defaults.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Handle settings changes
  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const updateNestedSetting = <K extends keyof SettingsState, NK extends keyof SettingsState[K]>(
    key: K,
    nestedKey: NK,
    value: SettingsState[K][NK],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [nestedKey]: value },
    }))
    setHasUnsavedChanges(true)
  }

  // Save all settings
  const handleSaveSettings = async () => {
    if (!rateLimiter.isAllowed("save-settings", 10, 60000)) {
      toast({
        title: "Too Many Requests",
        description: "Please wait before saving again.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Validate threshold
      if (!validateAmount(settings.lowBalanceThreshold)) {
        throw new Error("Invalid threshold amount")
      }

      // Save to localStorage
      localStorage.setItem("lowBalanceThreshold", settings.lowBalanceThreshold)
      localStorage.setItem("customCategories", JSON.stringify(settings.customCategories))
      localStorage.setItem("notificationSettings", JSON.stringify(settings.notifications))
      localStorage.setItem("appearanceSettings", JSON.stringify(settings.appearance))

      setHasUnsavedChanges(false)

      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Category management
  const handleAddCategory = () => {
    const sanitized = sanitizeInput(newCategory.trim())

    if (!sanitized) {
      toast({
        title: "Invalid Category",
        description: "Please enter a valid category name.",
        variant: "destructive",
      })
      return
    }

    if (settings.customCategories.includes(sanitized)) {
      toast({
        title: "Category Exists",
        description: "This category already exists.",
        variant: "destructive",
      })
      return
    }

    if (settings.customCategories.length >= 20) {
      toast({
        title: "Too Many Categories",
        description: "Maximum 20 categories allowed.",
        variant: "destructive",
      })
      return
    }

    const updatedCategories = [...settings.customCategories.filter((cat) => cat !== "Other"), sanitized, "Other"]

    updateSetting("customCategories", updatedCategories)
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

    updateSetting(
      "customCategories",
      settings.customCategories.filter((cat) => cat !== categoryToRemove),
    )
  }

  // Data management
  const handleResetFund = async () => {
    if (resetConfirmation !== "RESET") {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'RESET' to confirm",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
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
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset fund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    try {
      const exportData = {
        fundData: state,
        reconciliationHistory: JSON.parse(localStorage.getItem("reconciliationHistory") || "[]"),
        settings: {
          lowBalanceThreshold: settings.lowBalanceThreshold,
          customCategories: settings.customCategories,
          notifications: settings.notifications,
          appearance: settings.appearance,
        },
        exportDate: new Date().toISOString(),
        version: "1.0.0",
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
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)

        // Validate import data structure
        if (!importData.fundData && !importData.settings) {
          throw new Error("Invalid backup file format")
        }

        // Import fund data
        if (importData.fundData) {
          localStorage.setItem("pettyCashData", JSON.stringify(importData.fundData))
          dispatch({ type: "LOAD_FROM_STORAGE", payload: importData.fundData })
        }

        // Import reconciliation history
        if (importData.reconciliationHistory) {
          localStorage.setItem("reconciliationHistory", JSON.stringify(importData.reconciliationHistory))
        }

        // Import settings
        if (importData.settings) {
          const newSettings = { ...settings, ...importData.settings }
          setSettings(newSettings)

          localStorage.setItem("lowBalanceThreshold", newSettings.lowBalanceThreshold)
          localStorage.setItem("customCategories", JSON.stringify(newSettings.customCategories))
          localStorage.setItem("notificationSettings", JSON.stringify(newSettings.notifications))
          localStorage.setItem("appearanceSettings", JSON.stringify(newSettings.appearance))
        }

        setShowImportModal(false)
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
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setIsLoading(false)
      toast({
        title: "File Read Error",
        description: "Failed to read the selected file.",
        variant: "destructive",
      })
    }

    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-hierarchy-1">Settings</h1>
            <p className="text-caption">Manage your petty cash system preferences and data</p>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Unsaved changes
              </Badge>
            )}
            <Button onClick={handleSaveSettings} disabled={!hasUnsavedChanges || isSaving} className="min-w-[120px]">
              {isSaving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      max="999999.99"
                      value={settings.lowBalanceThreshold}
                      onChange={(e) => updateSetting("lowBalanceThreshold", e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-caption">You'll receive alerts when the balance falls below this amount</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Appearance</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-caption">Use smaller spacing and components</p>
                      </div>
                      <Switch
                        checked={settings.appearance.compactMode}
                        onCheckedChange={(checked) => updateNestedSetting("appearance", "compactMode", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Animations</Label>
                        <p className="text-caption">Enable smooth transitions and animations</p>
                      </div>
                      <Switch
                        checked={settings.appearance.showAnimations}
                        onCheckedChange={(checked) => updateNestedSetting("appearance", "showAnimations", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              {state.isInitialized && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>System Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Fund Initialized:</span>
                        <span className="font-medium">
                          {state.transactions.find((t) => t.type === "initialization")?.date
                            ? new Date(
                                state.transactions.find((t) => t.type === "initialization")!.date,
                              ).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Transactions:</span>
                        <Badge variant="secondary">{state.transactions.length}</Badge>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-medium font-mono text-lg">${state.balance.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Last Transaction:</span>
                        <span className="font-medium">
                          {state.transactions.length > 0
                            ? new Date(state.transactions[state.transactions.length - 1].date).toLocaleDateString()
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Categories Settings */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Disbursement Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {settings.customCategories.map((category, index) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1 text-sm">
                          <span>{category}</span>
                          {category !== "Other" && (
                            <button
                              onClick={() => handleRemoveCategory(category)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                              aria-label={`Remove ${category} category`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category"
                    maxLength={50}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim() || settings.customCategories.length >= 20}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-caption">
                  Categories help organize your disbursements. Maximum 20 categories allowed.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Balance Alerts</Label>
                      <p className="text-caption">Get notified when balance falls below threshold</p>
                    </div>
                    <Switch
                      checked={settings.notifications.lowBalance}
                      onCheckedChange={(checked) => updateNestedSetting("notifications", "lowBalance", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Transaction Notifications</Label>
                      <p className="text-caption">Get notified for each transaction</p>
                    </div>
                    <Switch
                      checked={settings.notifications.transactions}
                      onCheckedChange={(checked) => updateNestedSetting("notifications", "transactions", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reconciliation Reminders</Label>
                      <p className="text-caption">Get reminded to reconcile your fund</p>
                    </div>
                    <Switch
                      checked={settings.notifications.reconciliation}
                      onCheckedChange={(checked) => updateNestedSetting("notifications", "reconciliation", checked)}
                    />
                  </div>
                </div>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Notifications are currently shown as toast messages. Email notifications will be available in a
                    future update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Data Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button onClick={() => setShowExportModal(true)} variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                    <p className="text-caption">Download a backup of all your data</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="import-file" className="cursor-pointer">
                      <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </span>
                      </Button>
                    </Label>
                    <input id="import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    <p className="text-caption">Restore data from a backup file</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      These actions cannot be undone. Please proceed with caution.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setShowResetModal(true)}
                    variant="destructive"
                    className="w-full"
                    disabled={!state.isInitialized}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset Fund
                  </Button>
                  <p className="text-caption">Permanently delete all data and start fresh</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ConfirmDialog
          isOpen={showResetModal}
          onClose={() => {
            setShowResetModal(false)
            setResetConfirmation("")
          }}
          onConfirm={handleResetFund}
          title="Reset Petty Cash Fund"
          description={
            <div className="space-y-4">
              <p>
                This action will permanently delete all transactions, reconciliation history, and reset your fund. This
                cannot be undone.
              </p>
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
            </div>
          }
          confirmText="Reset Fund"
          variant="destructive"
          isLoading={isLoading}
        />

        <ConfirmDialog
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onConfirm={handleExportData}
          title="Export Data"
          description={
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
            </div>
          }
          confirmText="Export"
          variant="default"
        />
      </div>
    </AppLayout>
  )
}
