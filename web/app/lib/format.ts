const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
export const formatVnd = (n: number) => vnd.format(n);
export const formatDate = (d: Date | string) => new Date(d).toLocaleDateString("vi-VN");
