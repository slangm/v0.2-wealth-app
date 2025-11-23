"use client"

import { useState } from "react"
import {
  X,
  Clock,
  RefreshCw,
  Download,
  Upload,
  ArrowLeftRight,
  Building2,
  Landmark,
  CreditCard,
  Wallet,
  MapPin,
  QrCode,
  ChevronRight,
  ArrowLeft,
  Navigation,
} from "lucide-react"

interface AddMoneyFlowProps {
  isOpen: boolean
  onClose: () => void
}

type View = "menu" | "deposit" | "map" | "crypto"

export function AddMoneyFlow({ isOpen, onClose }: AddMoneyFlowProps) {
  const [currentView, setCurrentView] = useState<View>("menu")

  if (!isOpen) return null

  const handleBack = () => {
    if (currentView === "map" || currentView === "crypto") {
      setCurrentView("deposit")
    } else if (currentView === "deposit") {
      setCurrentView("menu")
    } else {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer/Sheet */}
      <div className="fixed inset-x-0 bottom-0 h-[90vh] bg-background rounded-t-3xl z-[70] animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          {currentView !== "menu" ? (
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-9" /> // Spacer
          )}

          <h2 className="text-xl font-semibold">
            {currentView === "menu" && "Transfer money"}
            {currentView === "deposit" && "Deposit"}
            {currentView === "map" && "Find locations"}
            {currentView === "crypto" && "Crypto Deposit"}
          </h2>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {currentView === "menu" ? (
            <div className="p-6 space-y-8">
              {/* Top Actions */}
              <div className="space-y-2">
                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="font-medium">View scheduled transfers</span>
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Set up automated savings plan</span>
                </button>
              </div>

              {/* Main Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView("deposit")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left group"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-muted-foreground">Into Wealth</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left group">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Withdraw</p>
                    <p className="text-sm text-muted-foreground">From Wealth</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left group">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Transfer</p>
                    <p className="text-sm text-muted-foreground">Between Wealth accounts</p>
                  </div>
                </button>
              </div>

              {/* More Ways */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-4 tracking-wider">
                  More ways to transfer
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors whitespace-nowrap">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Bring over investments</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors whitespace-nowrap">
                    <Landmark className="h-4 w-4" />
                    <span className="text-sm font-medium">Wire money</span>
                  </button>
                  <button
                    onClick={() => setCurrentView("crypto")}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors whitespace-nowrap"
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm font-medium">Crypto Deposit</span>
                  </button>
                </div>
              </div>
            </div>
          ) : currentView === "deposit" ? (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">Select a funding method</p>

                {/* Funding Methods List */}
                <button
                  onClick={() => setCurrentView("map")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Deposit paper money</p>
                      <p className="text-xs text-muted-foreground">Retail partners nearby</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Auto reload</p>
                      <p className="text-sm text-muted-foreground">Linked debit card</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Bank transfer</p>
                      <p className="text-sm text-muted-foreground">ACH / SPEI / Pix</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Alipay / WeChat Pay</p>
                      <p className="text-sm text-muted-foreground">Instant wallet top-up</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6514-2.7164 2.7174-2.7162-2.7174 2.7163-2.6514zm-4.6366.001l5.2297 5.2296-5.2297 5.2296-5.2296-5.2296 5.2296-5.2296zM3.271 9.2838l2.6924 2.7164L3.271 14.7166.5546 12l2.7164-2.7162zm13.353-7.353l2.7174 2.7164-7.353 7.353-7.353-7.353 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Binance</p>
                      <p className="text-sm text-muted-foreground">Connect account</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">On-chain transfer</p>
                      <p className="text-sm text-muted-foreground">Crypto wallet deposit</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Direct deposit</p>
                      <p className="text-sm text-muted-foreground">Get paid early</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : currentView === "crypto" ? (
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500 mb-4">
                  <QrCode className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">Deposit via Crypto</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Send tokens to your unique address on any supported network.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ethereum (ERC20)</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      Native
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border">
                    <code className="text-xs font-mono text-muted-foreground flex-1 break-all">
                      0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                    </code>
                    <button className="p-1.5 hover:bg-secondary rounded-md transition-colors text-primary">
                      <div className="h-4 w-4">📋</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Polygon (MATIC)</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Fast
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border">
                    <code className="text-xs font-mono text-muted-foreground flex-1 break-all">
                      0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                    </code>
                    <button className="p-1.5 hover:bg-secondary rounded-md transition-colors text-primary">
                      <div className="h-4 w-4">📋</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Arbitrum One</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Cheap
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border">
                    <code className="text-xs font-mono text-muted-foreground flex-1 break-all">
                      0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                    </code>
                    <button className="p-1.5 hover:bg-secondary rounded-md transition-colors text-primary">
                      <div className="h-4 w-4">📋</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <div className="text-yellow-600 mt-0.5">⚠️</div>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  Only send supported tokens (USDC, ETH, USDT) to these addresses. Sending other assets may result in
                  permanent loss.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Mock Map Area */}
              <div className="h-1/2 bg-muted relative w-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=13&size=600x300&style=feature:all|element:all|saturation:-100&key=YOUR_API_KEY')] bg-cover bg-center opacity-50 grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm font-medium bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
                    Map View Simulation
                  </p>
                </div>
                {/* Pins */}
                <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="h-8 w-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="h-8 w-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Store List */}
              <div className="flex-1 bg-background p-6 space-y-4 overflow-y-auto">
                <h3 className="font-semibold text-lg">Nearby Locations</h3>

                <div className="space-y-3">
                  <button className="w-full flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-yellow-600 text-xs">WU</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">Western Union</p>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                          Open
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">123 Market St • 0.2 mi</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Navigation className="h-3 w-3" />
                        Get Directions
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-red-600 text-xs">MG</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">MoneyGram</p>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                          Open
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">450 Broadway • 0.5 mi</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Navigation className="h-3 w-3" />
                        Get Directions
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-blue-600 text-xs">WM</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">Walmart MoneyCenter</p>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          Closes 9 PM
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">789 Main Ave • 1.2 mi</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <Navigation className="h-3 w-3" />
                        Get Directions
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
