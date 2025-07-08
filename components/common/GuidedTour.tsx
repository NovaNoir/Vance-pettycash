"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
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
        element.style.zIndex = "1000"
      }
    }
  }, [isOpen, currentStep, steps])

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
    onComplete()
    onClose()
    setCurrentStep(0)
  }

  const handleSkip = () => {
    onClose()
    setCurrentStep(0)
  }

  if (!isOpen || !steps[currentStep]) return null

  const step = steps[currentStep]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[999]"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-md mx-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSkip}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-6">{step.content}</p>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>

                  <Button onClick={handleNext}>
                    {currentStep === steps.length - 1 ? "Complete" : "Next"}
                    {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
