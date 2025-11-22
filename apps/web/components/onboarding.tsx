"use client"

import type React from "react"

import { useState } from "react"
import { Lock, Clock, ChevronLeft, HelpCircle, Wallet } from "lucide-react"
import { SavingsSimulation } from "@/components/savings-simulation"

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showDemo, setShowDemo] = useState(false)

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handleBack()
    }
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Move to login screen
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleNumberClick = (num: string) => {
    if (phoneNumber.length < 10) {
      setPhoneNumber((prev) => prev + num)
    }
  }

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />

      {step < 3 ? (
        <div
          className="relative flex flex-col h-full p-6 cursor-pointer"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={handleNext}
        >
          {/* Skip button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setStep(3)
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 mt-10 pb-8">
            {/* Visual Elements */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {step === 0 && (
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/40 to-primary shadow-[0_0_40px_rgba(var(--primary),0.5)] flex items-center justify-center animate-pulse">
                  <div className="w-36 h-36 rounded-full bg-background/90 backdrop-blur-sm" />
                </div>
              )}
              {step === 1 && (
                <div className="relative w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/40 to-primary shadow-[0_0_40px_rgba(var(--primary),0.5)] flex items-center justify-center transform rotate-3 transition-transform">
                  <Lock className="w-24 h-24 text-primary-foreground drop-shadow-lg" />
                </div>
              )}
              {step === 2 && (
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/40 to-primary shadow-[0_0_40px_rgba(var(--primary),0.5)] flex items-center justify-center">
                  <Clock className="w-24 h-24 text-primary-foreground drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="space-y-4 max-w-xs mx-auto">
              <h1 className="text-3xl font-bold tracking-tight">
                {step === 0 && "Earn up to 8% on your cash with Wealth."}
                {step === 1 && "Your Savings. Protected."}
                {step === 2 && "Your money. Your way."}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {step === 0 && "Secure your savings and earn interest every second."}
                {step === 1 && "Industry leading protection on your savings, up to $1M."}
                {step === 2 && "No deposit fees and no minimums. Withdraw anytime."}
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="mt-auto pb-6 space-y-6">
            {/* Pagination Dots */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Only show Get Started on the last step */}
            {step === 2 && (
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-full font-semibold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4"
              >
                Get Started
              </button>
            )}
            {/* Placeholder for layout stability when button is hidden */}
            {step !== 2 && <div className="h-14 w-full" />}

            <p className="text-center text-xs text-muted-foreground px-4 pb-safe">
              By using Wealth, you agree to accept our Terms of Use and Privacy Policy.
            </p>
          </div>
        </div>
      ) : (
        // Login Screen (Privy Style)
        <div className="relative flex flex-col h-full bg-background p-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-2 mb-8">
            <button onClick={handleBack} className="p-2 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Wealth</h1>
              <p className="text-muted-foreground">Log in or sign up to continue</p>
            </div>

            <div className="w-full space-y-4">
              {/* Google Login */}
              <button
                onClick={onComplete}
                className="w-full h-14 rounded-xl bg-card border border-border hover:bg-muted/50 flex items-center justify-center gap-3 transition-all font-medium text-foreground"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.75-1.44 1.03.09 1.93.69 2.5 1.49-3.69 1.86-2.22 6.51 1.64 7.82-.51 1.55-1.32 3.05-2.47 4.36zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Apple Login */}
              <button
                onClick={onComplete}
                className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-3 transition-all font-medium"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.75-1.44 1.03.09 1.93.69 2.5 1.49-3.69 1.86-2.22 6.51 1.64 7.82-.51 1.55-1.32 3.05-2.47 4.36zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>

              {/* Import Wallet */}
              <button
                onClick={onComplete}
                className="w-full h-14 rounded-xl bg-card border border-border hover:bg-muted/50 flex items-center justify-center gap-3 transition-all font-medium text-foreground"
              >
                <Wallet className="w-5 h-5" />
                Import Wallet
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground max-w-xs">
              By continuing, you agree to Wealth's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* Savings Simulation Modal */}
      <SavingsSimulation isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  )
}
