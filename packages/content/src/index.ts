export type LegalDocSlug = "terms" | "privacy" | "risk-disclosure"

type LegalDocCollection = Record<string, Record<LegalDocSlug, string>>

const docs: LegalDocCollection = {
  "en-US": {
    terms: `# Terms of Service (Preview)

Welcome to the Global Wealth & Freedom application (“Service”). By creating an account or using the Service you agree to the following foundational terms:

1. Self-custody: you retain direct control of your blockchain accounts. We never take possession of private keys or assets.
2. Eligibility: you confirm that you may legally use the Service in your jurisdiction and that you are not prohibited from interacting with the listed financial partners.
3. Educational nature: model projections and advisor output are illustrative and are **not** individualized investment, tax, or legal advice.
4. Risks: on-chain interactions involve smart-contract risk, price volatility, slippage, and potential loss of capital. Fiat rails are provided by third parties with their own terms.
5. Compliance: you agree to provide accurate information for required KYC/AML screening and to use the Service only for lawful purposes.

The full legal agreement will be delivered prior to public beta launch.`,
    privacy: `# Privacy Notice (Preview)

We collect the minimum data required to operate regulated money movement and to personalize your financial plan:

- Authentication identifiers from Privy (email + pseudonymous wallet).
- Funding preferences, rule configurations, and device metadata for security monitoring.
- Aggregated position data sourced from the blockchain and trusted providers.

We do **not** store raw identity documents on our infrastructure. When regulators require verification we rely on zero-knowledge attestations provided by approved partners. Data is encrypted at rest, access logged, and removed when no longer needed for compliance.`,
    "risk-disclosure": `# Risk Disclosure (Preview)

- Protected Savings allocates to short-duration U.S. Treasuries and blue-chip DeFi lenders. Capital is exposed to issuer default, smart-contract exploits, liquidity freezes, and FX volatility once converted.
- Growth strategies include diversified ETFs, tokenized equities, and crypto assets with materially higher drawdown potential. Values may fluctuate rapidly and could fall to zero.
- Rate boosters are promotional and may change without notice. Boosted yields are **never guaranteed**.
- Non-custodial architecture means you must safeguard your wallet credentials. Loss of recovery phrases can lead to irreversible loss of funds.
- In the event of platform downtime you can exit positions directly via on-chain contracts using your wallet.`,
  },
}

export function getLegalDoc(slug: LegalDocSlug, locale: string = "en-US") {
  const localized = docs[locale]
  if (localized?.[slug]) {
    return localized[slug]
  }
  return docs["en-US"][slug]
}

export function getAvailableLocales() {
  return Object.keys(docs)
}

