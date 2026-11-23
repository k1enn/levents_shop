import { formatVnd } from "~/lib/format";
import { salePrice, type Sale } from "~/lib/sale";

export function Price({ price, sale, className = "" }: { price: number; sale?: Sale; className?: string }) {
  const now = salePrice(price, sale);
  return (
    <span className={className}>
      <span className="font-bold text-red-600">{formatVnd(now)}</span>
      {now < price && <span className="ml-2 text-sm text-gray-400 line-through">{formatVnd(price)}</span>}
    </span>
  );
}
