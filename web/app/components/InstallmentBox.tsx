import { useState } from "react";
import { Form } from "react-router";
import { DOWN_PERCENTS, MONTHS, monthlyPayment, PLANS } from "~/lib/installment";
import { formatVnd } from "~/lib/format";
import { Turnstile } from "./Turnstile";

type Plan = keyof typeof PLANS;

export function InstallmentBox({ price, sku, result }: { price: number; sku: string; result?: { error?: string; ok?: string } }) {
  const [months, setMonths] = useState<number>(12);
  const [down, setDown] = useState<number>(0);
  const [plan, setPlan] = useState<Plan>("0%");
  const [open, setOpen] = useState(false);
  const pick = (cur: number | string, val: number | string) => (cur === val ? "btn px-3 py-1" : "btn-ghost px-3 py-1");

  return (
    <Form method="post" className="card flex flex-col gap-2 border border-orange-200">
      <h2 className="font-bold">Trả góp</h2>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PLANS) as Plan[]).map((p) => (
          <button type="button" key={p} onClick={() => setPlan(p)} className={pick(plan, p)}>Lãi {p === "0%" ? "0%" : "1,5%/tháng"}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button type="button" key={m} onClick={() => setMonths(m)} className={pick(months, m)}>{m} tháng</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {DOWN_PERCENTS.map((d) => (
          <button type="button" key={d} onClick={() => setDown(d)} className={pick(down, d)}>Trả trước {d}%</button>
        ))}
      </div>
      <p>
        Tạm tính: <b className="text-red-600">{formatVnd(monthlyPayment(price, down, months, PLANS[plan]))}</b>/tháng
        <span className="block text-xs text-gray-500">Chỉ là ước tính, không phải đề nghị tín dụng. Nhân viên sẽ tư vấn chính xác.</span>
      </p>
      <input type="hidden" name="intent" value="installment" />
      <input type="hidden" name="sku" value={sku} />
      <input type="hidden" name="months" value={months} />
      <input type="hidden" name="downPercent" value={down} />
      <input type="hidden" name="plan" value={plan} />
      {open ? (
        <>
          <input name="fullName" required maxLength={80} placeholder="Họ tên" className="input" />
          <input name="phone" required inputMode="tel" placeholder="Số điện thoại" className="input" />
          <Turnstile />
          <button className="btn">Gửi yêu cầu trả góp</button>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost">Đăng ký trả góp</button>
      )}
      {result?.error && <p className="err">{result.error}</p>}
      {result?.ok && <p className="text-green-700">{result.ok}</p>}
    </Form>
  );
}
