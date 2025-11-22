"use client"

import { X, Flashlight, Share2 } from "lucide-react"
import { useState } from "react"

interface ScanDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ScanDrawer({ isOpen, onClose }: ScanDrawerProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "code">("scan")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-[100] animate-in fade-in duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 px-6">
        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-1 bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("scan")}
            className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "scan" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/10"
            }`}
          >
            Scan
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "code" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/10"
            }`}
          >
            My Code
          </button>
        </div>
        <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          {activeTab === "scan" ? <Flashlight className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {activeTab === "scan" ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <h2 className="text-white text-3xl font-semibold mb-12 tracking-tight">Scan QR code to pay</h2>
            <div className="relative w-72 h-72 rounded-[2.5rem] overflow-hidden">
              <div className="absolute inset-0 border-[3px] border-white/30 rounded-[2.5rem]" />
              <div className="absolute inset-0 border-[3px] border-white rounded-[2.5rem] opacity-100 animate-pulse" />
              {/* Camera placeholder effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-50" />
            </div>
            <p className="text-white/70 mt-8 text-base font-medium">Position the QR Code in view to activate</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center pb-20">
            <div className="text-center mb-10">
              <h2 className="text-white text-4xl font-bold mb-2 tracking-tight">Shuliang Mei</h2>
              <p className="text-white/60 text-lg font-medium">$langmeii</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
              <div className="w-64 h-64 relative flex items-center justify-center">
                {/* Generated a new QR code placeholder as requested */}
                <img
                  src="/ethereum-qr-code.jpg"
                  alt="Ethereum Address QR Code"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              {/* Added Ethereum Mainnet label and warning */}
              <div className="text-center space-y-2 max-w-[250px]">
                <p className="text-black font-bold text-sm bg-gray-100 py-1 px-3 rounded-full inline-block">
                  Ethereum Mainnet Only
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  Warning: Send only ETH or ERC-20 tokens to this address. Sending other assets may result in permanent
                  loss.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
