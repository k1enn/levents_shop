import { useState } from "react";
import { Form } from "react-router";
import type { Route } from "./+types/thu-cu-doi-moi";
import { CONDITIONS, TRADE_IN_PRICES, tradeInQuote } from "~/data/trade-in-prices";
import { createLead } from "~/lib/leads.server";
import { guard } from "~/lib/guard.server";
import { oneOf, phone, str } from "~/lib/validate";
import { formatVnd } from "~/lib/format";
import { Turnstile } from "~/components/Turnstile";

export const meta: Route.MetaFunction = () => [{ title: "Thu cũ đổi mới - PhoneShop" }];

type Condition = keyof typeof CONDITIONS;
const MODELS = TRADE_IN_PRICES.map((p) => p.model);

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  await guard(request, fd, "lead");
  const model = oneOf(fd, "model", MODELS);
  const condition = oneOf(fd, "condition", Object.keys(CONDITIONS) as Condition[]);
  const fullName = str(fd, "fullName", 80);
  const tel = phone(fd);
  if (!model || !condition || !fullName || !tel) return { error: "Chọn máy, tình trạng và nhập họ tên, số điện thoại hợp lệ." };
  // Quote recomputed on the server, never read from the form.
  const quote = tradeInQuote(TRADE_IN_PRICES.find((p) => p.model === model)!.basePrice, CONDITIONS[condition]);
  await createLead({ type: "tradein", fullName, phone: tel, payload: { model, condition, quote } });
  return { ok: "Đã nhận yêu cầu, nhân viên sẽ gọi bạn để hẹn kiểm tra máy." };
}

export default function TradeIn({ actionData }: Route.ComponentProps) {
  const [model, setModel] = useState<string>(MODELS[0]);
  const [condition, setCondition] = useState<Condition>("Tốt");
  const base = TRADE_IN_PRICES.find((p) => p.model === model)!.basePrice;
  return (
    <Form method="post" className="card mx-auto flex max-w-md flex-col gap-3">
      <h1 className="text-xl font-bold">Thu cũ đổi mới</h1>
      <select name="model" value={model} onChange={(e) => setModel(e.target.value)} className="input" aria-label="Máy cũ">
        {MODELS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <select name="condition" value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className="input" aria-label="Tình trạng">
        {Object.keys(CONDITIONS).map((c) => <option key={c}>{c}</option>)}
      </select>
      <p>
        Giá thu dự kiến: <b className="text-red-600">{formatVnd(tradeInQuote(base, CONDITIONS[condition]))}</b>
        <span className="block text-xs text-gray-500">Tạm tính, giá chốt sau khi kiểm tra máy tại cửa hàng.</span>
      </p>
      <input name="fullName" required maxLength={80} placeholder="Họ tên" className="input" />
      <input name="phone" required inputMode="tel" placeholder="Số điện thoại" className="input" />
      <Turnstile />
      {actionData?.error && <p className="err">{actionData.error}</p>}
      {actionData?.ok && <p className="text-green-700">{actionData.ok}</p>}
      <button className="btn">Gửi yêu cầu</button>
    </Form>
  );
}
