import { data, Form, Link, useFetcher, useSearchParams } from "react-router";
import type { Route } from "./+types/phones.$slug";
import { getProductBySlug } from "~/lib/products.server";
import { addReview, listReviews } from "~/lib/reviews.server";
import { REVIEWS_PER_PAGE } from "~/lib/shop";
import { createLead } from "~/lib/leads.server";
import { requireUser } from "~/lib/auth.server";
import { guard } from "~/lib/guard.server";
import { userErrors } from "~/lib/errors";
import { CATALOG_CACHE, purge } from "~/lib/cache.server";
import { int, oneOf, phone, str } from "~/lib/validate";
import { salePrice } from "~/lib/sale";
import { formatDate } from "~/lib/format";
import { DOWN_PERCENTS, MONTHS, monthlyPayment, PLANS } from "~/lib/installment";
import { Price } from "~/components/Price";
import { InstallmentBox } from "~/components/InstallmentBox";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = await getProductBySlug(params.slug);
  if (!product) throw data("Not Found", { status: 404 });
  const sp = new URL(request.url).searchParams;
  const rpage = Math.min(Math.max(1, Math.floor(Number(sp.get("rpage")) || 1)), 100);
  const reviews = await listReviews(product._id, rpage);
  return { product, reviews, rpage, origin: new URL(request.url).origin };
}

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": CATALOG_CACHE });

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "Không tìm thấy" }];
  const { product: p, origin } = loaderData;
  const prices = p.variants.map((v) => salePrice(v.price, p.sale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    description: p.description,
    image: p.images.map((i) => `${origin}/images/${i}`),
    sku: p.variants[0]?.sku,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "VND",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.numReviews > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.numReviews } }),
  };
  return [
    { title: `${p.name} - PhoneShop` },
    { name: "description", content: p.description.slice(0, 160) },
    { property: "og:title", content: p.name },
    { property: "og:image", content: `${origin}/images/${p.images[0]}` },
    { "script:ld+json": jsonLd },
  ];
};

export async function action({ request, params }: Route.ActionArgs) {
  const fd = await request.formData();
  const product = await getProductBySlug(params.slug);
  if (!product) throw data("Not Found", { status: 404 });

  if (fd.get("intent") === "review") {
    const user = await requireUser(request);
    const rating = int(fd, "rating", 1, 5);
    const comment = str(fd, "comment", 1000);
    if (!rating || !comment) return { form: "review", error: "Chọn số sao và viết nhận xét." };
    const r = await userErrors(() => addReview({ productId: product._id, userId: user._id, name: user.name, rating, comment }));
    if (r && "error" in r) return { form: "review", ...r };
    await purge();
    return { form: "review", ok: "Cảm ơn bạn đã đánh giá." };
  }

  if (fd.get("intent") === "installment") {
    await guard(request, fd, "lead");
    const variant = product.variants.find((v) => v.sku === fd.get("sku"));
    const months = int(fd, "months");
    const downPercent = int(fd, "downPercent");
    const plan = oneOf(fd, "plan", Object.keys(PLANS) as (keyof typeof PLANS)[]);
    const fullName = str(fd, "fullName", 80);
    const tel = phone(fd);
    if (!variant || !plan || !MONTHS.includes(months as never) || !DOWN_PERCENTS.includes(downPercent as never) || !fullName || !tel)
      return { form: "installment", error: "Nhập họ tên và số điện thoại hợp lệ (10 số, bắt đầu bằng 0)." };
    const price = salePrice(variant.price, product.sale);
    await createLead({
      type: "installment",
      fullName,
      phone: tel,
      payload: { sku: variant.sku, name: product.name, price, months: months!, downPercent: downPercent!, plan, monthly: monthlyPayment(price, downPercent!, months!, PLANS[plan]) },
    });
    return { form: "installment", ok: "Đã nhận yêu cầu, nhân viên sẽ gọi bạn sớm." };
  }
  throw data("Bad Request", { status: 400 });
}


const gb = (n: number) => (n >= 1024 ? `${n / 1024} TB` : `${n} GB`);

export default function PhoneDetail({ loaderData: { product: p, reviews, rpage }, actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  const cart = useFetcher<{ error?: string; ok?: string }>();
  const v = p.variants.find((x) => x.sku === sp.get("sku")) ?? p.variants.find((x) => x.stock > 0) ?? p.variants[0];
  const colors = [...new Set(p.variants.map((x) => x.color))];
  const storages = [...new Set(p.variants.map((x) => x.storage))].sort((a, b) => a - b);
  // Pick the variant for a color + storage pair, falling back to any variant of that color.
  const skuFor = (color: string, storage: number) =>
    (p.variants.find((x) => x.color === color && x.storage === storage) ?? p.variants.find((x) => x.color === color))!.sku;
  const s = p.specs;
  const review = actionData?.form === "review" ? actionData : undefined;
  const lead = actionData?.form === "installment" ? actionData : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <img src={`/images/${v.image ?? p.images[0]}`} alt={p.name} className="card aspect-square w-full object-contain" />
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{p.name} {gb(v.storage)} {v.color}</h1>
          <Price price={v.price} sale={p.sale} className="text-2xl" />
          <div>
            <p className="mb-1 text-sm text-gray-600">Dung lượng</p>
            <div className="flex flex-wrap gap-2">
              {storages.map((st) => (
                <Link key={st} to={`?sku=${skuFor(v.color, st)}`} replace preventScrollReset className={st === v.storage ? "btn" : "btn-ghost"}>
                  {gb(st)}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm text-gray-600">Màu sắc</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <Link key={c} to={`?sku=${skuFor(c, v.storage)}`} replace preventScrollReset className={c === v.color ? "btn" : "btn-ghost"}>
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <p className={v.stock > 0 ? "text-green-700" : "text-red-600"}>{v.stock > 0 ? `Còn ${v.stock} máy` : "Hết hàng"}</p>
          <cart.Form method="post" action="/cart" className="flex gap-2">
            <input type="hidden" name="intent" value="add" />
            <input type="hidden" name="sku" value={v.sku} />
            <input type="hidden" name="qty" value="1" />
            <button className="btn flex-1" disabled={v.stock < 1 || cart.state !== "idle"}>
              Thêm vào giỏ
            </button>
            <Link to={`/compare?slugs=${p.slug}`} className="btn-ghost">
              So sánh
            </Link>
          </cart.Form>
          {cart.data?.error && <p className="err">{cart.data.error}</p>}
          {cart.data?.ok && <p className="text-green-700">{cart.data.ok} <Link to="/cart" className="underline">Xem giỏ</Link></p>}
          <InstallmentBox price={salePrice(v.price, p.sale)} sku={v.sku} result={lead} />
        </div>
      </div>

      <section className="card">
        <h2 className="mb-2 text-lg font-bold">Thông số kỹ thuật</h2>
        <table className="table">
          <tbody>
            {[["Màn hình", s.screen], ["Chip", s.chip], ["RAM", `${s.ram} GB`], ["Pin", `${s.battery} mAh`], ["Hệ điều hành", s.os], ["Camera", s.camera]].map(([k, val]) => (
              <tr key={k}>
                <td className="w-40 text-gray-600">{k}</td>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 whitespace-pre-line">{p.description}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          Đánh giá {p.numReviews > 0 && `· ★ ${p.rating} (${p.numReviews})`}
        </h2>
        {reviews.map((r) => (
          <div key={r._id} className="border-t pt-2">
            <p className="font-medium">
              {r.name} <span className="text-yellow-500">{"★".repeat(r.rating)}</span>
              <span className="ml-2 text-xs text-gray-400">{formatDate(r.createdAt)}</span>
            </p>
            <p className="whitespace-pre-line">{r.comment}</p>
          </div>
        ))}
        {(rpage > 1 || reviews.length === REVIEWS_PER_PAGE) && (
          <div className="flex gap-2">
            {rpage > 1 && <Link to={`?rpage=${rpage - 1}`} className="btn-ghost">Trước</Link>}
            {reviews.length === REVIEWS_PER_PAGE && <Link to={`?rpage=${rpage + 1}`} className="btn-ghost">Sau</Link>}
          </div>
        )}
        <Form method="post" className="flex flex-col gap-2 border-t pt-3">
          <input type="hidden" name="intent" value="review" />
          <select name="rating" defaultValue="5" className="input w-auto" aria-label="Số sao">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} sao</option>
            ))}
          </select>
          <textarea name="comment" rows={3} maxLength={1000} placeholder="Nhận xét của bạn (chỉ khách đã nhận hàng)" className="input" />
          {review?.error && <p className="err">{review.error}</p>}
          {review?.ok && <p className="text-green-700">{review.ok}</p>}
          <button className="btn self-start">Gửi đánh giá</button>
        </Form>
      </section>
    </div>
  );
}
