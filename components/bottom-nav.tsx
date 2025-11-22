"use client"

import { Home, TrendingUp, Search, Sparkles } from "lucide-react"
import { useState } from "react"

interface BottomNavProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function BottomNav({ activeTab: externalActiveTab, onTabChange }: BottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("home")

  const activeTab = externalActiveTab || internalActiveTab

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "investing", label: "Investing", icon: TrendingUp },
    { id: "explore", label: "Explore", icon: Search },
    { id: "advisor", label: "Advisor", icon: Sparkles },
  ]

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId)
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "scale-100"}`} />
              <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
