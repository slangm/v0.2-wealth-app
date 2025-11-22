"use client"

import { useState } from "react"
import { Sparkles, X, Send } from "lucide-react"

export function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Chat Interface Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full h-[85vh] sm:h-[600px] sm:max-w-md bg-background sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">FinAI Advisor</h3>
                  <p className="text-xs text-muted-foreground">Ask me anything about your portfolio</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* AI Message */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none text-sm">
                  <p>
                    Hello! I've analyzed your portfolio. Your "Protected Savings" is performing well with a 5.2% APY.
                    Would you like suggestions on diversifying your Growth Portfolio?
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground mt-1">
                  L
                </div>
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none text-sm">
                  <p>Yes, what do you recommend for tech exposure?</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none text-sm space-y-2">
                  <p>
                    Based on your current holdings, you're already heavy on large-cap tech (Apple, Microsoft). Consider
                    looking into:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Semiconductor ETFs for hardware exposure</li>
                    <li>Cybersecurity funds for sector resilience</li>
                    <li>Cloud infrastructure providers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full bg-muted/50 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <button className="absolute right-1.5 top-1.5 p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
