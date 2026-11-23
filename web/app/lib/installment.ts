export const MONTHS = [6, 9, 12] as const;
export const DOWN_PERCENTS = [0, 30, 50] as const;
export const PLANS = { "0%": 0, "Thường": 0.015 } as const;

// Flat rate model: monthly = (price - down) * (1 + rate * months) / months, rounded to 1,000 VND.
export function monthlyPayment(price: number, downPercent: number, months: number, ratePerMonth: number) {
  const loan = price * (1 - downPercent / 100);
  return Math.round((loan * (1 + ratePerMonth * months)) / months / 1000) * 1000;
}
