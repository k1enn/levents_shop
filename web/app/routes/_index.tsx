import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { homeData } from "~/lib/products.server";
import { CATALOG_CACHE } from "~/lib/cache.server";
import { Grid } from "~/components/ProductCard";
import { Countdown } from "~/components/Countdown";

export const meta: Route.MetaFunction = () => [
  { title: "PhoneShop - Điện thoại chính hãng" },
  { name: "description", content: "Điện thoại chính hãng, trả góp 0%, thu cũ đổi mới, bảo hành 12 tháng." },
];

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": CATALOG_CACHE });

export const loader = () => homeData();

export default function Home({ loaderData: { flash, newest } }: Route.ComponentProps) {
  const ends = flash[0]?.sale?.saleEndDate;
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 p-8 text-white">
        <h1 className="text-3xl font-bold">Điện thoại chính hãng, giá tốt</h1>
        <p className="mt-2">Trả góp 0% · Thu cũ đổi mới · Bảo hành 12 tháng</p>
        <Link to="/phones" className="btn mt-4 bg-white text-red-600 hover:bg-gray-100">
          Mua ngay
        </Link>
      </section>
      {flash.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">
            Flash sale {ends && <span className="text-red-600">· kết thúc sau <Countdown to={ends} /></span>}
          </h2>
          <Grid items={flash} />
        </section>
      )}
      <section>
        <h2 className="mb-3 text-xl font-bold">Mới nhất</h2>
        <Grid items={newest} />
      </section>
    </div>
  );
}
