// Shared constants for server and client code (no DB imports here).
export const STATUSES = ["pending", "paid", "shipping", "delivered", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const PAYMENT_METHODS = ["cod", "momo", "vnpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const SHIPPING_FEE = 30_000;
export const MAX_QTY = 5;
export const MAX_LINES = 20; // cookie session is capped at 4 KB
export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export const REVIEWS_PER_PAGE = 10;

// Admin moves. COD ships from pending; online orders must be paid first (only the IPN does pending -> paid).
export function nextStatuses(o: { status: Status; paymentMethod: PaymentMethod }): Status[] {
  switch (o.status) {
    case "pending":
      return o.paymentMethod === "cod" ? ["shipping", "cancelled"] : ["cancelled"];
    case "paid":
      return ["shipping", "cancelled"];
    case "shipping":
      return ["delivered"];
    default:
      return [];
  }
}

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export const PAY_LABEL: Record<PaymentMethod, string> = { cod: "COD", momo: "MoMo", vnpay: "VNPay" };
