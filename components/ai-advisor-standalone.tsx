"use client"

import {
  Sparkles,
  Send,
  Play,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  GraduationCap,
  Mic,
  Plus,
  Video,
  X,
  MicOff,
  Maximize2,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  action?: "transfer" | "allocate" | "analysis"
  actionData?: any
}

type Course = {
  id: string
  title: string
  description: string
  duration: string
  progress: number
  image: string
  modules: { title: string; duration: string }[]
}

interface AIAdvisorProps {
  initialPrompt?: string
}

export function AIAdvisorStandalone({ initialPrompt }: AIAdvisorProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "learn">("chat")
  const [input, setInput] = useState("")
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(true) // Added listening state for voice mode
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome back! I've analyzed your portfolio. Your 'Protected Savings' is performing well. How can I help you today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (initialPrompt) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialPrompt,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)

      // Simulate AI response for rebalancing
      setTimeout(() => {
        let responseContent = "I can certainly help with that."
        let action: Message["action"] = undefined
        let actionData: any = undefined

        if (initialPrompt.toLowerCase().includes("rebalance")) {
          responseContent =
            "I've analyzed your Growth Portfolio. It has drifted from your target allocation. Specifically, your Tech exposure is lower than recommended due to recent market moves. I suggest rebalancing to capture gains."
          action = "allocate"
          actionData = {
            current: { tech: 25, spy: 60, emerging: 15 },
            proposed: { tech: 30, spy: 55, emerging: 15 },
          }
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
          action,
          actionData,
        }
        setMessages((prev) => [...prev, aiMessage])
        setIsTyping(false)
      }, 1500)
    }
  }, [initialPrompt])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI processing
    setTimeout(() => {
      let responseContent = "I can certainly help with that. Could you provide more details?"
      let action: Message["action"] = undefined
      let actionData: any = undefined

      const lowerInput = userMessage.content.toLowerCase()

      if (lowerInput.includes("transfer") || lowerInput.includes("move money")) {
        responseContent =
          "I can help you transfer funds between your accounts. I've prepared a transfer for your approval based on your recent activity."
        action = "transfer"
        actionData = {
          from: "Protected Savings",
          to: "Growth Portfolio",
          amount: 500,
        }
      } else if (
        lowerInput.includes("allocate") ||
        lowerInput.includes("strategy") ||
        lowerInput.includes("rebalance")
      ) {
        responseContent =
          "I've analyzed the current market conditions. Tech stocks are showing strong momentum. I recommend adjusting your Growth Portfolio allocation."
        action = "allocate"
        actionData = {
          current: { tech: 25, spy: 60, emerging: 15 },
          proposed: { tech: 30, spy: 55, emerging: 15 },
        }
      } else if (lowerInput.includes("rate") || lowerInput.includes("market") || lowerInput.includes("check")) {
        responseContent =
          "I've checked the latest rates and market conditions. Your Protected Savings APY is competitive, but we could optimize your Growth Portfolio."
        action = "analysis"
        actionData = {
          savingsRate: "5.2%",
          marketTrend: "Bullish",
          recommendation: "Hold",
        }
      } else if (lowerInput.includes("learn") || lowerInput.includes("course")) {
        responseContent =
          "Great! Education is key to financial success. You can check out our 'Learn' tab for comprehensive courses. Would you like me to switch you there?"
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        action,
        actionData,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleFileUpload = () => {
    // In a real app, this would trigger a file picker
    console.log("Upload file clicked")
  }

  if (isVoiceMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-6 animate-in fade-in duration-300">
        {/* Header Controls */}
        <div className="w-full flex justify-between items-center text-white/70">
          <button
            onClick={() => setIsVoiceMode(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <div className="flex gap-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <span className="text-xs font-bold border border-white/30 rounded px-1">CC</span>
            </button>
          </div>
        </div>

        {/* Central Orb Animation */}
        <div className="flex-1 flex items-center justify-center w-full relative">
          <div className="relative flex items-center justify-center">
            {/* Dynamic Glow based on listening state */}
            <div
              className={`absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ${isListening ? "animate-pulse scale-110" : "scale-90 opacity-50"}`}
            />
            <div
              className={`absolute w-56 h-56 bg-white/10 rounded-full blur-2xl transition-all duration-1000 delay-75 ${isListening ? "animate-pulse scale-105" : "scale-95 opacity-40"}`}
            />

            {/* Core Orb */}
            <div
              className={`relative w-40 h-40 rounded-full overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all duration-500 ${isListening ? "scale-100" : "scale-95 grayscale-[0.5]"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-400 to-blue-600 animate-spin-slow opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent blur-md" />

              {/* Internal movement simulation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Conversation State Text */}
          <div className="absolute bottom-10 text-white/70 font-medium tracking-wide animate-pulse">
            {isListening ? "Listening..." : "Tap to speak"}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="w-full flex items-center justify-center gap-8 pb-8">
          <button className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <Video className="h-6 w-6" />
          </button>

          <button
            onClick={() => setIsListening(!isListening)}
            className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isListening ? "bg-white text-black scale-110" : "bg-red-500 text-white"}`}
          >
            {isListening ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
          </button>

          <button
            onClick={() => setIsVoiceMode(false)}
            className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    )
  }

  const courses: Course[] = [
    {
      id: "1",
      title: "Investment 101",
      description: "Master the basics of building a diversified portfolio.",
      duration: "45 mins",
      progress: 0,
      image: "/images/warren-buffet-ai.jpg",
      modules: [
        { title: "Understanding Asset Classes", duration: "10:00" },
        { title: "Risk vs. Reward", duration: "15:00" },
        { title: "Building Your First Portfolio", duration: "20:00" },
      ],
    },
    {
      id: "2",
      title: "Crypto Assets 101",
      description: "Learn about blockchain, Bitcoin, and Ethereum safely.",
      duration: "60 mins",
      progress: 30,
      image: "/images/vitalik-buterin-ai.jpg",
      modules: [
        { title: "What is Blockchain?", duration: "12:00" },
        { title: "Bitcoin & Ethereum", duration: "18:00" },
        { title: "DeFi & Web3", duration: "30:00" },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-screen pb-20 bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Wealth Advisor</h1>
              <p className="text-xs text-muted-foreground">Your financial partner</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "chat"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "learn"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Learn
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  {msg.role === "user" ? "L" : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/50 rounded-tl-none"
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>

                  {/* Action Cards */}
                  {msg.action === "transfer" && (
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        Confirm Transfer
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From</span>
                          <span className="font-medium">{msg.actionData.from}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">To</span>
                          <span className="font-medium">{msg.actionData.to}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-bold">
                          <span>Amount</span>
                          <span>${msg.actionData.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold hover:opacity-90">
                          Confirm
                        </button>
                        <button className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg text-xs font-bold hover:bg-secondary/80">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.action === "allocate" && (
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Strategy Adjustment
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Current</span>
                          <span>Proposed</span>
                        </div>
                        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${msg.actionData.current.spy}%` }}
                          />
                          <div
                            className="absolute top-0 h-full bg-purple-500 transition-all duration-500"
                            style={{
                              left: `${msg.actionData.current.spy}%`,
                              width: `${msg.actionData.current.tech}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>
                        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${msg.actionData.proposed.spy}%` }}
                          />
                          <div
                            className="absolute top-0 h-full bg-purple-500 transition-all duration-500"
                            style={{
                              left: `${msg.actionData.proposed.spy}%`,
                              width: `${msg.actionData.proposed.tech}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1">Increasing Tech exposure by 5%</p>
                      </div>
                      <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold hover:opacity-90">
                        Approve Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-3 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-5 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-3 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <div
                      className="w-2 h-4 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "450ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 bg-background border-t border-border/50">
            <div className="flex items-end gap-3 max-w-3xl mx-auto w-full">
              {/* Plus Button */}
              <button
                onClick={handleFileUpload}
                className="h-10 w-10 rounded-full bg-secondary/50 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>

              {/* Input Field */}
              <div className="relative flex-1 bg-secondary/30 rounded-full border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask anything"
                  className="w-full bg-transparent border-none py-3 pl-5 pr-12 text-sm focus:ring-0 focus:outline-none resize-none max-h-32 min-h-[44px] placeholder:text-muted-foreground/70"
                  rows={1}
                  style={{ minHeight: "44px" }}
                />

                {input.trim() ? (
                  <button
                    onClick={handleSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Mic className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Voice Mode Button */}
              <button
                onClick={() => setIsVoiceMode(true)}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity active:scale-95"
              >
                {/* Visual approximation of the waveform icon */}
                <div className="flex items-center gap-[2px]">
                  <div className="w-0.5 h-3 bg-white rounded-full" />
                  <div className="w-0.5 h-5 bg-white rounded-full" />
                  <div className="w-0.5 h-3 bg-white rounded-full" />
                  <div className="w-0.5 h-4 bg-white rounded-full" />
                </div>
              </button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground mt-3">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <p className="text-sm text-muted-foreground">Based on your portfolio goals</p>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative h-32 bg-muted">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-4 w-4 text-primary ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.duration}</span>
                      <span>{course.progress}% Complete</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                      <GraduationCap className="h-4 w-4" />
                      {course.progress > 0 ? "Continue Learning" : "Start Course"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Daily Quiz</h3>
                <p className="text-xs text-muted-foreground">Test your knowledge & earn rewards</p>
              </div>
            </div>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold hover:opacity-90">
              Take Quiz (+50 pts)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
