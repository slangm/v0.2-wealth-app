export type LadderProgress = {
  security: number
  freedom: number
  securityGoal: number
  freedomGoal: number
}

export function calculateLadderProgress(params: {
  totalNetWorth: number
  monthlyExpenses: number
  freedomYears?: number
}): LadderProgress {
  const { totalNetWorth, monthlyExpenses, freedomYears = 25 } = params
  const securityGoal = monthlyExpenses * 6
  const freedomGoal = monthlyExpenses * 12 * freedomYears

  const clamp = (value: number, max: number) => Math.min((value / max) * 100, 100)

  return {
    securityGoal,
    freedomGoal,
    security: clamp(totalNetWorth, securityGoal),
    freedom: clamp(totalNetWorth, freedomGoal),
  }
}

export function formatFiat(value: number, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

