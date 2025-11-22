"use client"

import { X, User, Bell, Shield, CreditCard, HelpCircle, LogOut } from "lucide-react"

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-background z-[70] animate-in slide-in-from-left duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-muted-foreground">Manage your account</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Customize alerts</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Security & Privacy</p>
                  <p className="text-sm text-muted-foreground">2FA, biometrics</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Payment Methods</p>
                  <p className="text-sm text-muted-foreground">Banks & cards</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-muted-foreground">FAQs, contact us</p>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium">
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
