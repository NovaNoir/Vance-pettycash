"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

export interface Transaction {
  id: string
  type: "disbursement" | "replenishment" | "initialization"
  amount: number
  date: string
  purpose?: string
  recipient?: string
  timestamp: number
}

interface PettyCashState {
  balance: number
  transactions: Transaction[]
  isInitialized: boolean
}

type PettyCashAction =
  | { type: "INITIALIZE"; payload: { amount: number; date: string } }
  | { type: "DISBURSE"; payload: { amount: number; date: string; purpose: string; recipient: string } }
  | { type: "REPLENISH"; payload: { amount: number; date: string } }
  | { type: "LOAD_FROM_STORAGE"; payload: PettyCashState }

const initialState: PettyCashState = {
  balance: 0,
  transactions: [],
  isInitialized: false,
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function pettyCashReducer(state: PettyCashState, action: PettyCashAction): PettyCashState {
  switch (action.type) {
    case "INITIALIZE":
      const initTransaction: Transaction = {
        id: generateTransactionId(),
        type: "initialization",
        amount: action.payload.amount,
        date: action.payload.date,
        timestamp: Date.now(),
      }
      return {
        balance: action.payload.amount,
        transactions: [initTransaction],
        isInitialized: true,
      }

    case "DISBURSE":
      const disbursement: Transaction = {
        id: generateTransactionId(),
        type: "disbursement",
        amount: action.payload.amount,
        date: action.payload.date,
        purpose: action.payload.purpose,
        recipient: action.payload.recipient,
        timestamp: Date.now(),
      }
      return {
        ...state,
        balance: state.balance - action.payload.amount,
        transactions: [...state.transactions, disbursement],
      }

    case "REPLENISH":
      const replenishment: Transaction = {
        id: generateTransactionId(),
        type: "replenishment",
        amount: action.payload.amount,
        date: action.payload.date,
        timestamp: Date.now(),
      }
      return {
        ...state,
        balance: state.balance + action.payload.amount,
        transactions: [...state.transactions, replenishment],
      }

    case "LOAD_FROM_STORAGE":
      return action.payload

    default:
      return state
  }
}

const PettyCashContext = createContext<{
  state: PettyCashState
  dispatch: React.Dispatch<PettyCashAction>
} | null>(null)

export function PettyCashProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pettyCashReducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("pettyCashData")
    if (stored) {
      try {
        const parsedData = JSON.parse(stored)
        dispatch({ type: "LOAD_FROM_STORAGE", payload: parsedData })
      } catch (error) {
        console.error("Error loading data from localStorage:", error)
      }
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("pettyCashData", JSON.stringify(state))
  }, [state])

  return <PettyCashContext.Provider value={{ state, dispatch }}>{children}</PettyCashContext.Provider>
}

export function usePettyCash() {
  const context = useContext(PettyCashContext)
  if (!context) {
    throw new Error("usePettyCash must be used within a PettyCashProvider")
  }
  return context
}
