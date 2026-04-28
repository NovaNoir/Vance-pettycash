"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { generateSecureId, secureStorage, type SupportedCurrency } from "@/lib/security"

export interface Transaction {
  id: string
  type: "initialization" | "disbursement" | "replenishment" | "reconciliation"
  amount: number
  description: string
  date: string
  category?: string
  recipient?: string
  status: "pending" | "completed" | "cancelled"
  receiptUrl?: string
  notes?: string
}

export interface PettyCashSettings {
  currency: SupportedCurrency
  lowBalanceThreshold: number
  requireReceipts: boolean
  autoBackup: boolean
  notifications: boolean
}

export interface PettyCashState {
  isInitialized: boolean
  balance: number
  initialAmount: number
  transactions: Transaction[]
  settings: PettyCashSettings
  lastUpdated: string
}

type PettyCashAction =
  | { type: "INITIALIZE"; payload: { amount: number; description: string } }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: { id: string; updates: Partial<Transaction> } }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<PettyCashSettings> }
  | { type: "LOAD_STATE"; payload: PettyCashState }
  | { type: "RESET_STATE" }

const initialState: PettyCashState = {
  isInitialized: false,
  balance: 0,
  initialAmount: 0,
  transactions: [],
  settings: {
    currency: "USD",
    lowBalanceThreshold: 100,
    requireReceipts: false,
    autoBackup: true,
    notifications: true,
  },
  lastUpdated: new Date().toISOString(),
}

function pettyCashReducer(state: PettyCashState, action: PettyCashAction): PettyCashState {
  switch (action.type) {
    case "INITIALIZE": {
      const initTransaction: Transaction = {
        id: generateSecureId("init"),
        type: "initialization",
        amount: action.payload.amount,
        description: action.payload.description,
        date: new Date().toISOString(),
        status: "completed",
      }

      return {
        ...state,
        isInitialized: true,
        balance: action.payload.amount,
        initialAmount: action.payload.amount,
        transactions: [initTransaction],
        lastUpdated: new Date().toISOString(),
      }
    }

    case "ADD_TRANSACTION": {
      const newTransaction = action.payload
      let newBalance = state.balance

      if (newTransaction.type === "disbursement") {
        newBalance -= newTransaction.amount
      } else if (newTransaction.type === "replenishment") {
        newBalance += newTransaction.amount
      }

      return {
        ...state,
        balance: Math.max(0, newBalance),
        transactions: [...state.transactions, newTransaction],
        lastUpdated: new Date().toISOString(),
      }
    }

    case "UPDATE_TRANSACTION": {
      const { id, updates } = action.payload
      const transactionIndex = state.transactions.findIndex((t) => t.id === id)

      if (transactionIndex === -1) return state

      const oldTransaction = state.transactions[transactionIndex]
      const updatedTransaction = { ...oldTransaction, ...updates }

      // Recalculate balance
      let balanceAdjustment = 0
      if (oldTransaction.type === "disbursement") {
        balanceAdjustment += oldTransaction.amount
      } else if (oldTransaction.type === "replenishment") {
        balanceAdjustment -= oldTransaction.amount
      }

      if (updatedTransaction.type === "disbursement") {
        balanceAdjustment -= updatedTransaction.amount
      } else if (updatedTransaction.type === "replenishment") {
        balanceAdjustment += updatedTransaction.amount
      }

      const newTransactions = [...state.transactions]
      newTransactions[transactionIndex] = updatedTransaction

      return {
        ...state,
        balance: Math.max(0, state.balance + balanceAdjustment),
        transactions: newTransactions,
        lastUpdated: new Date().toISOString(),
      }
    }

    case "DELETE_TRANSACTION": {
      const transactionId = action.payload
      const transaction = state.transactions.find((t) => t.id === transactionId)

      if (!transaction) return state

      let balanceAdjustment = 0
      if (transaction.type === "disbursement") {
        balanceAdjustment += transaction.amount
      } else if (transaction.type === "replenishment") {
        balanceAdjustment -= transaction.amount
      }

      return {
        ...state,
        balance: Math.max(0, state.balance + balanceAdjustment),
        transactions: state.transactions.filter((t) => t.id !== transactionId),
        lastUpdated: new Date().toISOString(),
      }
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        lastUpdated: new Date().toISOString(),
      }
    }

    case "LOAD_STATE": {
      return action.payload
    }

    case "RESET_STATE": {
      return initialState
    }

    default:
      return state
  }
}

interface PettyCashContextType {
  state: PettyCashState
  dispatch: React.Dispatch<PettyCashAction>
  initializeFund: (amount: number, description: string) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  updateSettings: (settings: Partial<PettyCashSettings>) => void
  resetState: () => void
}

const PettyCashContext = createContext<PettyCashContextType | undefined>(undefined)

export function PettyCashProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pettyCashReducer, initialState)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = secureStorage.getItem<PettyCashState>("state")
    if (savedState) {
      dispatch({ type: "LOAD_STATE", payload: savedState })
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (state.isInitialized) {
      secureStorage.setItem("state", state)
    }
  }, [state])

  const initializeFund = (amount: number, description: string) => {
    dispatch({ type: "INITIALIZE", payload: { amount, description } })
  }

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateSecureId("txn"),
    }
    dispatch({ type: "ADD_TRANSACTION", payload: newTransaction })
  }

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    dispatch({ type: "UPDATE_TRANSACTION", payload: { id, updates } })
  }

  const deleteTransaction = (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id })
  }

  const updateSettings = (settings: Partial<PettyCashSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings })
  }

  const resetState = () => {
    secureStorage.removeItem("state")
    dispatch({ type: "RESET_STATE" })
  }

  return (
    <PettyCashContext.Provider
      value={{
        state,
        dispatch,
        initializeFund,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateSettings,
        resetState,
      }}
    >
      {children}
    </PettyCashContext.Provider>
  )
}

export function usePettyCash() {
  const context = useContext(PettyCashContext)
  if (context === undefined) {
    throw new Error("usePettyCash must be used within a PettyCashProvider")
  }
  return context
}
