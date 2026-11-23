export type Sale = {
  isOnSale: boolean;
  saleType: "percentage" | "fixed";
  saleValue: number;
  saleStartDate: Date | string;
  saleEndDate: Date | string;
};

export function isSaleActive(sale: Sale | undefined, now = new Date()): sale is Sale {
  return !!sale?.isOnSale && now >= new Date(sale.saleStartDate) && now <= new Date(sale.saleEndDate);
}

// VND has no decimals, so round to whole dong.
export function salePrice(price: number, sale: Sale | undefined, now = new Date()) {
  if (!isSaleActive(sale, now)) return price;
  const p = sale.saleType === "percentage" ? price * (1 - sale.saleValue / 100) : price - sale.saleValue;
  return Math.max(0, Math.round(p));
}
