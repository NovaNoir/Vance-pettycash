"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TourStep {
  target: string
  title: string
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

interface GuidedTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function GuidedTour({ steps, isOpen, onClose, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target) as HTMLElement
      setTargetElement(element)

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.style.position = "relative"
        element.style.zIndex = "1001"
      }
    }
  }, [currentStep, isOpen, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Reset z-index for all elements
    steps.forEach((step) => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        element.style.zIndex = ""
      }
    })
    onComplete()
    onClose()
  }

  const handleSkip = () => {
    // Reset z-index for all elements
    steps.forEach((step) => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        element.style.zIndex = ""
      }
    })
    onClose()
  }

  if (!isOpen || !steps[currentStep] || !targetElement) return null

  const step = steps[currentStep]
  const rect = targetElement.getBoundingClientRect()

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const position = step.position || "bottom"
    const offset = 20

    switch (position) {
      case "top":
        return {
          top: rect.top - offset,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        }
      case "bottom":
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, 0)",
        }
      case "left":
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - offset,
          transform: "translate(-100%, -50%)",
        }
      case "right":
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + offset,
          transform: "translate(0, -50%)",
        }
      default:
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, 0)",
        }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-1000"
            style={{ zIndex: 1000 }}
          />

          {/* Highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed border-2 border-primary rounded-lg pointer-events-none"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              zIndex: 1001,
            }}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-1002 max-w-sm"
            style={getTooltipPosition()}
          >
            <Card className="shadow-lg border-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSkip} className="h-6 w-6 -mt-1 -mr-1">
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    {currentStep > 0 && (
                      <Button variant="outline" size="sm" onClick={handlePrevious} className="bg-transparent">
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                      </Button>
                    )}
                    <Button size="sm" onClick={handleNext}>
                      {currentStep === steps.length - 1 ? "Finish" : "Next"}
                      {currentStep < steps.length - 1 && <ArrowRight className="h-3 w-3 ml-1" />}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
