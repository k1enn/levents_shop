import { formatVnd } from "~/lib/format";
import { salePrice, type Sale } from "~/lib/sale";

export function Price({ price, sale, className = "" }: { price: number; sale?: Sale; className?: string }) {
  const now = salePrice(price, sale);
  return (
    <span className={className}>
      <span className="font-extrabold text-black">{formatVnd(now)}</span>
      {now < price && <span className="ml-2 text-[0.85em] text-gray-500 line-through">{formatVnd(price)}</span>}
    </span>
  );
}
