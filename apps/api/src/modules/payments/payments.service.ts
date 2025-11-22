import { Injectable } from "@nestjs/common"

type FundingOption = {
  id: string
  label: string
  provider: string
  speed: string
  fees: string
  description: string
  regionTags: string[]
}

const fundingOptions: FundingOption[] = [
  {
    id: "mercado-pago",
    label: "Mercado Pago cash-in",
    provider: "Mercado Pago",
    speed: "instant",
    fees: "0.4% FX spread",
    description: "Present barcode at Rapipago / PagoFacil.",
    regionTags: ["AR", "CL"],
  },
  {
    id: "moonpay",
    label: "MoonPay card on-ramp",
    provider: "MoonPay",
    speed: "instant",
    fees: "2.9% + $0.50",
    description: "Visa/Mastercard deposit into USDC.",
    regionTags: ["GLOBAL"],
  },
  {
    id: "walletconnect",
    label: "On-chain transfer",
    provider: "WalletConnect",
    speed: "instant",
    fees: "Gas sponsored",
    description: "Deposit stablecoins from any EVM wallet.",
    regionTags: ["GLOBAL"],
  },
]

@Injectable()
export class PaymentsService {
  getFundingOptions() {
    return fundingOptions
  }

  async createDeposit(optionId: string, amount: number) {
    const option = fundingOptions.find((o) => o.id === optionId)
    return {
      id: `dep_${Date.now()}`,
      optionId,
      provider: option?.provider ?? "unknown",
      amount,
      status: "pending",
      etaMinutes: option?.speed === "instant" ? 2 : 60,
    }
  }
}

