import { useState } from "react";
import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/admin.products.$id";
import { saveImage } from "~/lib/images.server";
import { requireAdmin } from "~/lib/auth.server";
import { getProduct, minPrice, saveProduct, type Variant } from "~/lib/products.server";
import { purge } from "~/lib/cache.server";
import { int, oneOf, str } from "~/lib/validate";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (params.id === "new") return { p: null };
  const p = await getProduct(params.id);
  if (!p) throw data("Not Found", { status: 404 });
  return { p };
}

// datetime-local has no zone; the shop runs on Vietnam time (GMT+7).
const toVnDate = (s?: string) => (s ? new Date(`${s}:00+07:00`).toISOString() : undefined);
const toInput = (d?: Date | string) => (d ? new Date(new Date(d).getTime() + 7 * 3600_000).toISOString().slice(0, 16) : "");

export async function action({ request, params }: Route.ActionArgs) {
  await requireAdmin(request);
  const fd = await request.formData();
  const all = (k: string) => fd.getAll(k).map(String);
  const skus = all("v_sku");
  const variants: Variant[] = skus.map((sku, i) => ({
    sku: sku.trim().toUpperCase(),
    color: all("v_color")[i]?.trim(),
    storage: Number(all("v_storage")[i]),
    price: Number(all("v_price")[i]),
    stock: Number(all("v_stock")[i]),
  }));
  const bad = (n: number) => !Number.isInteger(n) || n < 0;
  const base = {
    name: str(fd, "name", 120),
    slug: str(fd, "slug", 120)?.toLowerCase(),
    brand: str(fd, "brand", 40),
    description: str(fd, "description", 5000) ?? "",
    specs: {
      screen: str(fd, "screen", 120) ?? "",
      chip: str(fd, "chip", 120) ?? "",
      ram: int(fd, "ram", 1, 64),
      battery: int(fd, "battery", 0, 20000) ?? 0,
      os: str(fd, "os", 60) ?? "",
      camera: str(fd, "camera", 200) ?? "",
    },
  };
  if (!base.name || !base.slug || !/^[a-z0-9-]+$/.test(base.slug) || !base.brand || !base.specs.ram)
    return { error: "Tên, slug (a-z, 0-9, -), hãng và RAM là bắt buộc." };
  if (!variants.length || variants.some((v) => !v.sku || !v.color || bad(v.storage) || !v.storage || bad(v.price) || !v.price || bad(v.stock)))
    return { error: "Mỗi phiên bản cần SKU, màu, bộ nhớ, giá > 0 và tồn kho >= 0." };
  if (new Set(variants.map((v) => v.sku)).size !== variants.length) return { error: "SKU bị trùng." };

  const isOnSale = fd.get("isOnSale") === "on";
  const sale = {
    isOnSale,
    saleType: oneOf(fd, "saleType", ["percentage", "fixed"] as const) ?? "percentage",
    saleValue: Number(fd.get("saleValue")) || 0,
    saleStartDate: toVnDate(str(fd, "saleStartDate", 20)) ?? new Date().toISOString(),
    saleEndDate: toVnDate(str(fd, "saleEndDate", 20)) ?? new Date().toISOString(),
  };
  if (isOnSale && (sale.saleValue <= 0 || (sale.saleType === "percentage" && sale.saleValue > 90) || !(sale.saleEndDate > sale.saleStartDate)))
    return { error: "Khuyến mãi: giá trị > 0 (tối đa 90%), ngày kết thúc sau ngày bắt đầu." };

  const files = fd.getAll("upload").filter((f): f is File => f instanceof File && f.size > 0);
  const images = all("images");
  for (const f of files) {
    const key = await saveImage(f);
    if (!key) return { error: "Ảnh phải là JPG, PNG hoặc WEBP và tối đa 2 MB." };
    images.push(key);
  }
  if (!images.length) return { error: "Cần ít nhất 1 ảnh." };

  const { name, slug, brand } = base;
  const doc = { ...base, name, slug, brand, specs: { ...base.specs, ram: base.specs.ram }, variants, images, minPrice: minPrice(variants), sale, isActive: fd.get("isActive") === "on" };
  const r = await saveProduct(params.id, doc);
  if ("notFound" in r) throw data("Not Found", { status: 404 });
  if ("dup" in r) return { error: "Slug hoặc SKU đã tồn tại ở sản phẩm khác." };
  await purge();
  throw redirect("/admin/products");
}

type Row = Pick<Variant, "sku" | "color"> & { storage: number | ""; price: number | ""; stock: number | ""; key: string };

export default function EditProduct({ loaderData: { p }, actionData }: Route.ComponentProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    (p?.variants.length ? p.variants : [{ sku: "", color: "", storage: "", price: "", stock: "" }]).map((v) => ({ ...v, key: crypto.randomUUID() }) as Row),
  );
  const [images, setImages] = useState(p?.images ?? []);
  const s = p?.specs;
  const field = (name: string, label: string, value?: string | number, type = "text") => (
    <label className="flex flex-col text-sm">
      {label}
      <input name={name} type={type} defaultValue={value} className="input" />
    </label>
  );
  return (
    <Form method="post" encType="multipart/form-data" className="card flex flex-col gap-3">
      <h1>{p ? `Sửa ${p.name}` : "Thêm sản phẩm"}</h1>
      <div className="grid gap-2 md:grid-cols-3">
        {field("name", "Tên", p?.name)}
        {field("slug", "Slug (URL)", p?.slug)}
        {field("brand", "Hãng", p?.brand)}
        {field("screen", "Màn hình", s?.screen)}
        {field("chip", "Chip", s?.chip)}
        {field("ram", "RAM (GB)", s?.ram, "number")}
        {field("battery", "Pin (mAh)", s?.battery, "number")}
        {field("os", "Hệ điều hành", s?.os)}
        {field("camera", "Camera", s?.camera)}
      </div>
      <label className="flex flex-col text-sm">
        Mô tả
        <textarea name="description" rows={4} defaultValue={p?.description} className="input" />
      </label>

      <h2>Phiên bản</h2>
      {rows.map((r, i) => (
        <div key={r.key} className="grid grid-cols-6 gap-2">
          <input name="v_sku" defaultValue={r.sku} placeholder="SKU" className="input" aria-label="SKU" />
          <input name="v_color" defaultValue={r.color} placeholder="Màu" className="input" aria-label="Màu" />
          <input name="v_storage" type="number" defaultValue={r.storage} placeholder="GB" className="input" aria-label="Bộ nhớ" />
          <input name="v_price" type="number" defaultValue={r.price} placeholder="Giá" className="input" aria-label="Giá" />
          <input name="v_stock" type="number" defaultValue={r.stock} placeholder="Tồn" className="input" aria-label="Tồn kho" />
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="btn-ghost" disabled={rows.length === 1}>Xóa</button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { sku: "", color: "", storage: "", price: "", stock: "", key: crypto.randomUUID() }])} className="btn-ghost self-start">
        + Phiên bản
      </button>

      <h2>Ảnh</h2>
      <div className="flex flex-wrap gap-2">
        {images.map((k) => (
          <div key={k} className="relative">
            <input type="hidden" name="images" value={k} />
            <img src={`/images/${k}`} alt="" className="h-20 w-20 object-contain" />
            <button type="button" onClick={() => setImages(images.filter((x) => x !== k))} className="absolute right-0 top-0 bg-black px-1 text-white" aria-label="Bỏ ảnh">×</button>
          </div>
        ))}
      </div>
      <input type="file" name="upload" multiple accept="image/jpeg,image/png,image/webp" />

      <h2>Khuyến mãi / Flash sale</h2>
      <div className="grid gap-2 md:grid-cols-5">
        <label className="flex items-center gap-2"><input type="checkbox" name="isOnSale" defaultChecked={p?.sale?.isOnSale} /> Bật</label>
        <select name="saleType" defaultValue={p?.sale?.saleType ?? "percentage"} className="input" aria-label="Kiểu giảm">
          <option value="percentage">%</option>
          <option value="fixed">VND</option>
        </select>
        <input name="saleValue" type="number" defaultValue={p?.sale?.saleValue} placeholder="Giá trị" className="input" aria-label="Giá trị giảm" />
        <input name="saleStartDate" type="datetime-local" defaultValue={toInput(p?.sale?.saleStartDate)} className="input" aria-label="Bắt đầu" />
        <input name="saleEndDate" type="datetime-local" defaultValue={toInput(p?.sale?.saleEndDate)} className="input" aria-label="Kết thúc" />
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} /> Đang bán</label>
      {actionData?.error && <p className="err">{actionData.error}</p>}
      <button className="btn self-start">Lưu</button>
    </Form>
  );
}
