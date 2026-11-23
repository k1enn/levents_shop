import { Form } from "react-router";
import type { Route } from "./+types/bao-hanh";
import { orderByImei } from "~/lib/orders.server";
import { isValidImei, WARRANTY_MONTHS } from "~/lib/imei";
import { limit } from "~/lib/guard.server";
import { formatDate } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Tra cứu bảo hành - PhoneShop" }];

// Public: rate limited, and returns only model + dates so a guessed IMEI leaks no personal data.
export async function loader({ request }: Route.LoaderArgs) {
  const imei = new URL(request.url).searchParams.get("imei")?.trim();
  if (!imei) return { result: null };
  if (!isValidImei(imei)) return { result: { error: "IMEI không hợp lệ (15 chữ số)." } };
  await limit(request, "imei");
  const found = await orderByImei(imei);
  const o = found?.status === "delivered" ? found : undefined;
  const item = o?.items.find((i) => i.imeis?.includes(imei));
  const delivered = o?.statusHistory.find((h) => h.status === "delivered")?.at;
  if (!item || !delivered) return { result: { error: "Không tìm thấy máy với IMEI này." } };
  const end = new Date(delivered);
  end.setMonth(end.getMonth() + WARRANTY_MONTHS);
  return { result: { found: { model: `${item.name} ${item.color} ${item.storage}GB`, bought: o!.createdAt, end, active: end > new Date() } } };
}

export default function Warranty({ loaderData: { result } }: Route.ComponentProps) {
  return (
    <div className="card mx-auto flex max-w-md flex-col gap-3">
      <h1 className="text-xl font-bold">Tra cứu bảo hành</h1>
      <Form method="get" className="flex gap-2">
        <input name="imei" required inputMode="numeric" maxLength={15} placeholder="Nhập IMEI (bấm *#06#)" className="input" />
        <button className="btn">Tra cứu</button>
      </Form>
      {result?.error && <p className="err">{result.error}</p>}
      {result?.found && (
        <div>
          <p className="font-bold">{result.found.model}</p>
          <p>Ngày mua: {formatDate(result.found.bought)}</p>
          <p>Bảo hành đến: {formatDate(result.found.end)}</p>
          <p className={result.found.active ? "text-green-700" : "text-red-600"}>{result.found.active ? "Còn bảo hành" : "Hết bảo hành"}</p>
        </div>
      )}
    </div>
  );
}
