import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/compare";
import { activeProducts } from "~/lib/products.server";
import { COMPARE_KEY } from "~/components/ProductCard";
import { Price } from "~/components/Price";

export const meta: Route.MetaFunction = () => [{ title: "So sánh điện thoại - PhoneShop" }];

export async function loader({ request }: Route.LoaderArgs) {
  const slugs = (new URL(request.url).searchParams.get("slugs") ?? "").split(",").filter(Boolean).slice(0, 3);
  if (!slugs.length) return { list: [] };
  const docs = await activeProducts();
  return { list: slugs.flatMap((s) => docs.filter((d) => d.slug === s)) };
}

const ROWS: [string, (p: Route.ComponentProps["loaderData"]["list"][number]) => React.ReactNode][] = [
  ["Giá từ", (p) => <Price price={p.minPrice} sale={p.sale} />],
  ["Màn hình", (p) => p.specs.screen],
  ["Chip", (p) => p.specs.chip],
  ["RAM", (p) => `${p.specs.ram} GB`],
  ["Bộ nhớ", (p) => [...new Set(p.variants.map((v) => v.storage))].join(" / ") + " GB"],
  ["Pin", (p) => `${p.specs.battery} mAh`],
  ["Camera", (p) => p.specs.camera],
  ["Hệ điều hành", (p) => p.specs.os],
  ["Đánh giá", (p) => (p.numReviews ? `★ ${p.rating} (${p.numReviews})` : "-")],
];

export default function Compare({ loaderData: { list } }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  // Empty URL: restore the list saved by the "So sánh" buttons.
  useEffect(() => {
    if (sp.get("slugs")) return;
    const saved: string[] = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
    if (saved.length) navigate(`?slugs=${saved.join(",")}`, { replace: true });
  }, [sp]);
  const remove = (slug: string) => {
    const next = list.map((p) => p.slug).filter((s) => s !== slug);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    navigate(next.length ? `?slugs=${next.join(",")}` : "/phones");
  };
  if (!list.length) return <div className="card">Chưa chọn sản phẩm. <Link to="/phones" className="underline">Chọn điện thoại</Link></div>;
  return (
    <div className="card overflow-x-auto">
      <h1 className="mb-2">So sánh</h1>
      <table className="table min-w-[600px]">
        <thead>
          <tr>
            <th />
            {list.map((p) => (
              <th key={p.slug} className="align-top">
                <img src={`/images/${p.images[0]}`} alt="" className="h-24 object-contain" />
                <Link to={`/phones/${p.slug}`} className="block">{p.name}</Link>
                <button onClick={() => remove(p.slug)} className="text-xs font-normal underline">Bỏ</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, get]) => (
            <tr key={label}>
              <td className="text-gray-600">{label}</td>
              {list.map((p) => <td key={p.slug}>{get(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
