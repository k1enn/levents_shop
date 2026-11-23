import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { activeProducts, homeData } from "~/lib/products.server";
import { CATALOG_CACHE } from "~/lib/cache.server";
import { Grid } from "~/components/ProductCard";
import { Countdown } from "~/components/Countdown";
import { Banner } from "~/components/Banner";
import { CategoryBar, CategoryGrid } from "~/components/CategoryGrid";

export const meta: Route.MetaFunction = () => [
  { title: "PhoneShop - Điện thoại chính hãng" },
  { name: "description", content: "Điện thoại chính hãng, trả góp 0%, thu cũ đổi mới, bảo hành 12 tháng." },
];

const BANNERS = [
  ["iphone-16-pro-max", "iPhone 16 Pro Max"],
  ["samsung-galaxy-z-flip6", "Samsung Galaxy Z Flip6", "z-flip-6"],
  ["xiaomi-redmi-note-14-pro", "Xiaomi Redmi Note 14 Pro", "redmi-note-14-pro"],
  ["vivo-x200-pro", "vivo X200 Pro", "vivo-x200"],
  ["iphone-13", "iPhone 13"],
].map(([slug, alt, file = slug]) => ({ to: `/phones/${slug}`, image: `/images/seed/banners/${file}-banner.jpg`, alt }));

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": CATALOG_CACHE });

export async function loader() {
  const [home, active] = await Promise.all([homeData(), activeProducts()]);
  const covers = new Map<string, string>();
  for (const p of active) if (p.images[0] && !covers.has(p.brand)) covers.set(p.brand, p.images[0]);
  return { ...home, covers: [...covers].sort(([a], [b]) => a.localeCompare(b)) };
}

export default function Home({ loaderData: { flash, newest, covers } }: Route.ComponentProps) {
  const ends = flash[0]?.sale?.saleEndDate;
  return (
    <div className="flex flex-col">
      <Banner slides={BANNERS} />
      <CategoryGrid covers={covers} />
      {flash.length > 0 && (
        <section className="mb-12">
          <h1 className="text-center">Flash sale</h1>
          {ends && <p className="mb-4 text-center">Kết thúc sau <Countdown to={ends} /></p>}
          <Grid items={flash} />
        </section>
      )}
      <section className="mb-8">
        <h1 className="text-center">Khám phá ngay</h1>
        <CategoryBar brands={covers.map(([b]) => b)} />
      </section>
      <section className="flex flex-col">
        <h1 className="text-center">Sản phẩm mới</h1>
        <Grid items={newest} />
        <Link to="/phones" className="btn mt-8 self-center px-10">Xem thêm</Link>
      </section>
    </div>
  );
}
