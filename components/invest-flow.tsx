"use client"

import { useState } from "react"
import { X, ArrowRight, Check, DollarSign, Wallet } from "lucide-react"

interface InvestFlowProps {
  isOpen: boolean
  onClose: () => void
  strategy: any
}

export function InvestFlow({ isOpen, onClose, strategy }: InvestFlowProps) {
  const [amount, setAmount] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleInvest = () => {
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true)
    }, 1000)
  }

  if (isSuccess) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200" onClick={onClose} />
        <div className="fixed inset-x-0 bottom-0 h-[50vh] bg-background rounded-t-3xl z-[70] animate-in slide-in-from-bottom duration-300 flex flex-col items-center justify-center text-center p-6">
          <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6 animate-in zoom-in duration-300">
            <Check className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Investment Confirmed!</h2>
          <p className="text-muted-foreground mb-8">
            You successfully invested <span className="text-foreground font-semibold">${amount}</span> into{" "}
            {strategy?.name || "Strategy"}.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground h-14 rounded-full font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 min-h-[60vh] bg-background rounded-t-3xl z-[70] animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Invest Amount</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Strategy Info */}
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-full ${strategy?.badgeColor || "bg-secondary"} flex items-center justify-center`}
            >
              {strategy?.icon ? <strategy.icon className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investing in</p>
              <h3 className="font-semibold text-lg">{strategy?.name || "Selected Strategy"}</h3>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Available to invest</p>
                <p className="font-bold text-lg">$18,845.23</p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="h-8 w-8" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-20 pl-14 pr-4 text-4xl font-bold bg-transparent border-b-2 border-border focus:border-primary outline-none transition-colors placeholder:text-muted-foreground/20"
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              {["100", "500", "1000", "Max"].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val === "Max" ? "18845.23" : val)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors text-sm"
                >
                  {val === "Max" ? "Max" : `$${val}`}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleInvest}
              disabled={!amount || Number(amount) <= 0}
              className="w-full bg-primary text-primary-foreground h-14 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              Confirm Investment <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
