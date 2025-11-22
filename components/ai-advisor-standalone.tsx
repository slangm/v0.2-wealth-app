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
  Paperclip,
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

export function AIAdvisorStandalone() {
  const [activeTab, setActiveTab] = useState<"chat" | "learn">("chat")
  const [input, setInput] = useState("")
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
                      className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 border-t border-border bg-background">
            <div className="relative flex items-start gap-2">
              <button
                onClick={handleFileUpload}
                className="flex-shrink-0 mt-2 p-2.5 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors active:scale-95"
                aria-label="Upload file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Message FinAI..."
                className="flex-1 bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
                style={{ minHeight: "44px" }}
              />

              {input.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={isTyping}
                  className="flex-shrink-0 mt-2 p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              ) : (
                <button
                  className="flex-shrink-0 mt-2 p-2.5 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors active:scale-95"
                  aria-label="Voice input"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2 px-2">
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
