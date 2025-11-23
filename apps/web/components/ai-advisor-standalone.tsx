"use client";

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
  Coins,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

type AdvisorAction = {
  summary: string;
  type?: string;
  simulationOnly?: boolean;
  stockSymbol?: string;
  amount?: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AdvisorAction[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  image: string;
  modules: { title: string; duration: string }[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export function AIAdvisorStandalone() {
  const [activeTab, setActiveTab] = useState<"chat" | "learn">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome back! Ask anything about Safe/Growth allocations. I'll propose actions and summaries.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Optional: Try to get token, but don't fail if API is not available
    // Backend will use dev user automatically if no token is provided
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "web-demo", region: "US" }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const access = data?.tokens?.accessToken as string | undefined;
          if (access) {
            setToken(access);
          }
        }
        // Silently ignore auth failures - backend will use dev user
      } catch (err) {
        // Silently ignore network errors - backend will use dev user
        // Token is optional now
      }
    })();

    // Fetch user account info
    fetchAccountInfo();
  }, [token]);

  const fetchAccountInfo = async () => {
    try {
      const resp = await fetch(`${API_BASE}/dinari/account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setAccountInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch account info:", err);
    }
  };

  const handleRequestFaucet = async () => {
    if (isRequestingFaucet) return;
    setIsRequestingFaucet(true);

    try {
      const resp = await fetch(`${API_BASE}/dinari/faucet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // chainId is automatically determined from user's stored data
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(
          `Faucet request failed: ${errorText || resp.statusText}`
        );
      }

      const data = await resp.json();
      // Refresh account info after faucet
      await fetchAccountInfo();
      // Add success message to chat
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "✅ Successfully requested 1,000 mockUSD from sandbox faucet! You can now use this balance to buy Dinari stocks.",
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Faucet error", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Failed to request faucet: ${error instanceof Error ? error.message : String(error)}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsRequestingFaucet(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const url = `${API_BASE}/agent/chat`;
      console.log("Sending request to:", url);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Token is optional - backend will use dev user if not provided
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage.content }),
        // Explicitly set mode for CORS
        mode: "cors",
      });

      console.log("Response status:", resp.status, resp.statusText);
      console.log(
        "Response headers:",
        Object.fromEntries(resp.headers.entries())
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("API error response:", errorText);
        throw new Error(
          `API error ${resp.status}: ${errorText || resp.statusText}`
        );
      }

      const data = await resp.json();
      console.log("API response data:", data);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.reply ??
          "I can help rebalance Safe/Growth and Beefy allocations.",
        actions: data.actions,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("advisor error", error);
      console.error(
        "Error type:",
        error instanceof TypeError ? "TypeError" : typeof error
      );
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const fallback: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `I had trouble reaching the advisor service: ${errorMessage}. Please check the browser console for details. API URL: ${API_BASE}`,
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = () => {
    // In a real app, this would trigger a file picker
    console.log("Upload file clicked");
  };

  const handleConfirmOrder = async (stockSymbol: string, amount: number) => {
    if (confirmingOrder) return;
    setConfirmingOrder(`${stockSymbol}-${amount}`);

    try {
      const resp = await fetch(`${API_BASE}/dinari/orders/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ stockSymbol, amount }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Order failed: ${errorText || resp.statusText}`);
      }

      const data = await resp.json();
      // Add success message to chat
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Order confirmed! ${data.message || `Successfully placed order for $${amount} worth of ${stockSymbol}`}`,
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Order error", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Failed to place order: ${error instanceof Error ? error.message : String(error)}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setConfirmingOrder(null);
    }
  };

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
  ];

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
              <h1 className="text-xl font-bold tracking-tight">
                Wealth Advisor
              </h1>
              <p className="text-xs text-muted-foreground">
                Your financial partner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accountInfo && accountInfo.walletAddress && (
              <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                {`${accountInfo.walletAddress.slice(0, 6)}...${accountInfo.walletAddress.slice(-4)}`}
              </div>
            )}
            <button
              onClick={handleRequestFaucet}
              disabled={isRequestingFaucet}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Request 1,000 mockUSD from sandbox faucet"
            >
              <Coins className="h-4 w-4" />
              {isRequestingFaucet ? "Requesting..." : "Get Test Funds"}
            </button>
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
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
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

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Proposed steps
                      </div>
                      <div className="space-y-2 text-xs">
                        {msg.actions.map((act, idx) => (
                          <div
                            key={`${msg.id}-act-${idx}`}
                            className="bg-muted/30 rounded-lg p-2"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold">
                                {act.type === "buy_stock"
                                  ? "Buy Stock"
                                  : (act.type ?? "action")}
                              </span>
                              {act.simulationOnly ? (
                                <span className="text-[10px] text-muted-foreground">
                                  simulation
                                </span>
                              ) : null}
                            </div>
                            <p className="text-muted-foreground mb-2">
                              {act.summary}
                            </p>
                            {act.type === "buy_stock" &&
                              act.stockSymbol &&
                              act.amount &&
                              !act.simulationOnly && (
                                <button
                                  onClick={() =>
                                    handleConfirmOrder(
                                      act.stockSymbol!,
                                      act.amount!
                                    )
                                  }
                                  disabled={
                                    confirmingOrder ===
                                    `${act.stockSymbol}-${act.amount}`
                                  }
                                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {confirmingOrder ===
                                  `${act.stockSymbol}-${act.amount}`
                                    ? "Placing Order..."
                                    : `Confirm Buy $${act.amount} ${act.stockSymbol}`}
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
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
                    e.preventDefault();
                    handleSend();
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
            <p className="text-sm text-muted-foreground">
              Based on your portfolio goals
            </p>
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.duration}</span>
                      <span>{course.progress}% Complete</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                      <GraduationCap className="h-4 w-4" />
                      {course.progress > 0
                        ? "Continue Learning"
                        : "Start Course"}
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
                <p className="text-xs text-muted-foreground">
                  Test your knowledge & earn rewards
                </p>
              </div>
            </div>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold hover:opacity-90">
              Take Quiz (+50 pts)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
