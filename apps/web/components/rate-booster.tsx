"use client"

import { X, Check, Zap, Users, BookOpen, ArrowRight, TrendingUp } from "lucide-react"

interface RateBoosterProps {
  isOpen: boolean
  onClose: () => void
}

export function RateBooster({ isOpen, onClose }: RateBoosterProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl border-t border-border p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Boost your APY</h2>
            <p className="text-muted-foreground">Complete actions to earn up to 8.0% APY</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted/20 hover:bg-muted/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Rate Card */}
        <div className="bg-success/10 border border-success/20 rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-success">Current Rate</span>
            <span className="text-3xl font-bold text-success">4.0%</span>
          </div>
          <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden">
            <div className="bg-success h-full w-[50%] rounded-full" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">Target: 8.0%</p>
        </div>

        {/* Boosters List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Available Boosters</h3>

          {/* Base Rate */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Base Rate</h4>
              <p className="text-sm text-muted-foreground">Treasury-backed RWA</p>
            </div>
            <span className="font-bold text-lg">4.0%</span>
          </div>

          {/* AAVE Auto Lending */}
          <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-success/50 transition-colors text-left group">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold group-hover:text-success transition-colors">Enable Auto Lending via AAVE</h4>
              <p className="text-sm text-muted-foreground">Automatically lend idle funds</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-success block">+2.0%</span>
              <span className="text-xs text-muted-foreground">Enable Now</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Referrals */}
          <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-success/50 transition-colors text-left group">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold group-hover:text-success transition-colors">Referral Bonus</h4>
              <p className="text-sm text-muted-foreground">Invite friends to earn more</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-success block">+2.0%</span>
              <span className="text-xs text-muted-foreground">Invite Friends</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Auto-Saver */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-indigo-500/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
              ACTIVE
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Auto-Saver</h4>
              <p className="text-sm text-muted-foreground">Recurring deposit enabled</p>
            </div>
            <span className="font-bold text-lg text-success">+2.0%</span>
          </div>

          {/* Learning */}
          <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left group">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold group-hover:text-primary transition-colors">Financial Learning</h4>
              <p className="text-sm text-muted-foreground">Complete modules for bonus</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-muted-foreground block">0.0%</span>
              <span className="text-xs text-muted-foreground">Start Now</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground">
          <p>
            * Boosted rates are subject to terms and conditions. Auto lending via AAVE and referral bonuses can each add
            up to +2.0% APY. Learning module bonuses are valid for 90 days from completion.
          </p>
        </div>
      </div>
    </>
  )
}
