"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ShieldCheck, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Ticker = {
  symbol: string
  name: string
  price: number
  change: number
  type: "CRYPTO" | "RWA" | "STOCK"
  verified: boolean
}

const INITIAL_DATA: Ticker[] = [
  // Ondo Global Markets
  { symbol: "OUSG", name: "Ondo US Short-Term Govt Bond", price: 104.52, change: 0.05, type: "RWA", verified: true },
  { symbol: "USDY", name: "Ondo US Dollar Yield", price: 1.05, change: 0.01, type: "RWA", verified: true },
  { symbol: "OMMF", name: "Ondo US Money Market", price: 1.0, change: 0.0, type: "RWA", verified: true },
  { symbol: "TSLAon", name: "Tesla - Ondo Tokenized", price: 178.25, change: -1.2, type: "STOCK", verified: true },
  { symbol: "AAPLon", name: "Apple - Ondo Tokenized", price: 182.4, change: 0.5, type: "STOCK", verified: true },
  { symbol: "GOOGLon", name: "Alphabet - Ondo Tokenized", price: 142.1, change: 0.8, type: "STOCK", verified: true },
  { symbol: "AMZNon", name: "Amazon - Ondo Tokenized", price: 175.35, change: 1.1, type: "STOCK", verified: true },
  { symbol: "MSFTon", name: "Microsoft - Ondo Tokenized", price: 405.15, change: 0.3, type: "STOCK", verified: true },
  { symbol: "NVDAon", name: "NVIDIA - Ondo Tokenized", price: 890.5, change: 2.5, type: "STOCK", verified: true },
  { symbol: "COINon", name: "Coinbase - Ondo Tokenized", price: 245.8, change: 4.2, type: "STOCK", verified: true },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", price: 68450.0, change: 1.5, type: "CRYPTO", verified: true },
  { symbol: "ETH", name: "Ethereum", price: 3840.25, change: 2.1, type: "CRYPTO", verified: true },
  { symbol: "LINK", name: "Chainlink", price: 18.45, change: 5.4, type: "CRYPTO", verified: true },
  { symbol: "SOL", name: "Solana", price: 145.2, change: -0.5, type: "CRYPTO", verified: true },
  { symbol: "UNI", name: "Uniswap", price: 12.5, change: 1.2, type: "CRYPTO", verified: true },
  { symbol: "AAVE", name: "Aave", price: 115.3, change: 3.1, type: "CRYPTO", verified: true },
  { symbol: "MATIC", name: "Polygon", price: 0.95, change: -1.1, type: "CRYPTO", verified: true },
]

export function OracleSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [tickers, setTickers] = useState<Ticker[]>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((current) =>
        current.map((t) => ({
          ...t,
          price: t.price * (1 + (Math.random() * 0.002 - 0.001)), // Random fluctuation +/- 0.1%
          change: t.change + (Math.random() * 0.1 - 0.05),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredTickers = tickers.filter(
    (t) => t.symbol.toLowerCase().includes(query.toLowerCase()) || t.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div ref={containerRef} className="relative w-full z-50">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by ticker (e.g. OUSG, TSLAon, ETH)..."
          className="w-full bg-muted/50 border border-border rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (query.length > 0 || filteredTickers.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 bg-muted/30 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Oracle Live Feed</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-blue-500" />
              <span>Powered by Chainlink</span>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2">
            {filteredTickers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No assets found matching "{query}"</div>
            ) : (
              filteredTickers.map((ticker) => (
                <button
                  key={ticker.symbol}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                  onClick={() => {
                    setQuery(ticker.symbol)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                        ticker.type === "RWA"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : ticker.type === "STOCK"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                      )}
                    >
                      {ticker.symbol.slice(0, 3)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{ticker.symbol}</span>
                        {ticker.verified && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{ticker.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-medium text-sm">
                      ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div
                      className={cn(
                        "flex items-center justify-end gap-0.5 text-xs font-medium",
                        ticker.change >= 0 ? "text-green-500" : "text-red-500",
                      )}
                    >
                      {ticker.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(ticker.change).toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 bg-muted/30 border-t border-border text-[10px] text-center text-muted-foreground">
            Data secured by Chainlink Decentralized Oracle Networks
          </div>
        </div>
      )}
    </div>
  )
}
