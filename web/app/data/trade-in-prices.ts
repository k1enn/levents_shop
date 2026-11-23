// shortcut: static price list, move to a collection when staff need to edit prices without a deploy.
export const TRADE_IN_PRICES = [
  { model: "iPhone 11", basePrice: 3_500_000 },
  { model: "iPhone 11 Pro Max", basePrice: 5_000_000 },
  { model: "iPhone 12", basePrice: 5_000_000 },
  { model: "iPhone 12 Pro Max", basePrice: 7_500_000 },
  { model: "iPhone 13", basePrice: 7_000_000 },
  { model: "iPhone 13 Pro Max", basePrice: 10_500_000 },
  { model: "iPhone 14", basePrice: 9_000_000 },
  { model: "iPhone 14 Pro Max", basePrice: 14_000_000 },
  { model: "iPhone 15", basePrice: 11_500_000 },
  { model: "iPhone 15 Pro Max", basePrice: 18_000_000 },
  { model: "Samsung Galaxy S21", basePrice: 3_500_000 },
  { model: "Samsung Galaxy S22", basePrice: 5_000_000 },
  { model: "Samsung Galaxy S23", basePrice: 7_500_000 },
  { model: "Samsung Galaxy S23 Ultra", basePrice: 11_000_000 },
  { model: "Samsung Galaxy Z Flip5", basePrice: 7_000_000 },
  { model: "Xiaomi 13", basePrice: 5_500_000 },
  { model: "Xiaomi Redmi Note 12", basePrice: 1_800_000 },
  { model: "OPPO Reno10", basePrice: 3_500_000 },
  { model: "OPPO Find N2 Flip", basePrice: 6_000_000 },
  { model: "Google Pixel 7", basePrice: 4_500_000 },
] as const;

export const CONDITIONS = { "Như mới": 1, "Tốt": 0.85, "Trầy xước": 0.7, "Lỗi nhẹ": 0.5 } as const;

export const tradeInQuote = (basePrice: number, grade: number) => Math.round((basePrice * grade) / 10_000) * 10_000;
