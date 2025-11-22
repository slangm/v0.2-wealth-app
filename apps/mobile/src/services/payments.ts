import Toast from "react-native-toast-message"

export type FundingOption = {
  id: string
  label: string
  provider: string
  speed: "instant" | "same-day" | "1-3 days"
  fees: string
  description: string
  regionTags: string[]
  type: "cash" | "bank" | "card" | "on-chain"
}

const options: FundingOption[] = [
  {
    id: "mercado-pago",
    label: "Mercado Pago cash-in",
    provider: "Mercado Pago",
    speed: "instant",
    fees: "0.4% FX spread",
    description: "Show barcode at any Rapipago or PagoFacil to deposit pesos.",
    regionTags: ["AR", "CL"],
    type: "cash",
  },
  {
    id: "moonpay-card",
    label: "Card on-ramp",
    provider: "MoonPay",
    speed: "instant",
    fees: "2.9% + $0.50",
    description: "Use Visa/Mastercard to top up USDC on Ethereum.",
    regionTags: ["GLOBAL"],
    type: "card",
  },
  {
    id: "local-ach",
    label: "Local bank transfer",
    provider: "Partner Bank",
    speed: "1-3 days",
    fees: "Free",
    description: "ACH/SPEI/PIX instructions generated for your account.",
    regionTags: ["BR", "MX", "US"],
    type: "bank",
  },
  {
    id: "wallet-connect",
    label: "On-chain transfer",
    provider: "WalletConnect",
    speed: "instant",
    fees: "Gas sponsored",
    description: "Send stablecoins from any EVM wallet into your smart account.",
    regionTags: ["GLOBAL"],
    type: "on-chain",
  },
]

export async function fetchFundingOptions() {
  return options
}

export async function initiateDeposit({
  amount,
  optionId,
}: {
  amount: number
  optionId: string
}) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  Toast.show({
    type: "success",
    text1: "Deposit initiated",
    text2: `We started your ${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} transfer via ${
      options.find((o) => o.id === optionId)?.label ?? "selected method"
    }`,
  })
}

export async function generateCashBarcode() {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return `MP-${Math.floor(Math.random() * 1_000_000)}`
}

