# Phase 3: Payments (MoMo + VNPay IPN)

Priority: P1. Status: Pending. Effort: 6h. Needs: phase 2.

## Overview

Online payment in sandbox. Order state changes only in the IPN handlers, which must be safe to call many times.

## Key insights

* VNPay (verified from sandbox docs, PAY 2.1.0): `vnp_SecureHash` = HMAC SHA512 over params sorted by name. Update the order only at the IPN URL (GET, server to server). Return URL only checks the signature and shows a message. VNPay retries up to 10 times, 5 minutes apart, unless it gets RspCode 00 or 02.
* MoMo: existing logic in `backend/controllers/momoController.js` (create signature at lines 40 to 68, IPN signature at line 190, HMAC SHA256). It hardcodes `localhost` URLs at lines 25 and 26; the port must use `APP_URL`. MoMo IPN rules are UNVERIFIED by research: read `developers.momo.vn/v3/docs/payment/api/result-handling/notification/` before coding.
* Idempotency needs no KV: 1 conditional update on the order is enough.

## Architecture

`app/lib/payment.server.ts`:

```ts
// 1 helper for both gateways
async function hmacHex(hash: "SHA-256" | "SHA-512", secret: string, msg: string): Promise<string>

export async function createMomoPayment(order): Promise<string>   // returns payUrl
export async function verifyMomoIpn(body): Promise<boolean>
export function buildVnpayUrl(order, ip): Promise<string>
export async function verifyVnpay(params: URLSearchParams): Promise<boolean> // drops vnp_SecureHash and vnp_SecureHashType, sorts, encodes spaces as +

// the only place an order becomes paid
export async function markPaid(code: string, amount: number, ref: string): Promise<"ok" | "already" | "not_found" | "bad_amount">
```

`markPaid`: find order by code; if missing `not_found`; if `totals.total !== amount` then `bad_amount`; then `updateOne({ code, status: "pending" }, { $set: { status: "paid", paidAt, paymentRef: ref }, $push: { statusHistory } })`. `modifiedCount` 0 means `already`.

Compare signatures with `crypto.subtle.timingSafeEqual`.

## Files

Create in `web/app/`:
* `lib/payment.server.ts`
* `routes/pay.$code.tsx`: action picks gateway from the order, redirects to the gateway URL. Only for the order owner and `status: "pending"`.
* `routes/api.momo.ipn.tsx`: POST action.
* `routes/api.vnpay.ipn.tsx`: GET loader.
* `routes/payment.return.tsx`: verifies signature, shows success or failure, links to the order. Does NOT write.

Modify: `routes/checkout.tsx` (redirect to `/pay/<code>` for online methods), `routes/orders.$code.tsx` ("Thanh toan lai" button while pending).

## Steps

1. `hmacHex` with `crypto.subtle.importKey` + `sign`.
2. Port MoMo create: same raw signature field order as the old controller, `fetch` to `https://test-payment.momo.vn/v2/gateway/api/create`, `ipnUrl` and `redirectUrl` built from `APP_URL`.
3. MoMo IPN: verify signature, then `resultCode === 0` calls `markPaid`; other codes cancel the order and restock. Respond 204.
4. VNPay URL builder: amount times 100, `vnp_TxnRef` = order code, `vnp_CreateDate` in GMT+7.
5. VNPay IPN response map: bad signature `97`, `not_found` `01`, `bad_amount` `04`, `already` `02`, `ok` `00`, any throw `99`. Always HTTP 200 with JSON `{ RspCode, Message }`.
6. Failed VNPay payment (`vnp_ResponseCode` not `00`): cancel + restock, still answer `00` (the IPN was processed).
7. Cancel + restock is 1 function in `orders.server.ts`, shared with the admin cancel from phase 2, and is itself conditional on `status: "pending"` so it cannot run twice.
8. Test IPN with a public URL: deploy to a preview Worker, or `cloudflared tunnel --url http://localhost:5173`.

## Todo

- [ ] `hmacHex` + `markPaid`
- [ ] MoMo create + IPN
- [ ] VNPay URL + IPN + return page
- [ ] Shared cancel and restock
- [ ] Sandbox run for both gateways

## Success criteria

* MoMo sandbox and VNPay sandbox: pay an order, it becomes `paid` without opening the return page.
* Replaying the same IPN request with curl: order unchanged, VNPay answer is `02`.
* IPN with 1 changed character in the signature: rejected (`97` for VNPay), order unchanged.
* IPN with a different amount: rejected, order unchanged.
* Opening the return URL by hand with fake success params does not mark the order paid.

## Risks

* Pending orders hold stock forever if the buyer leaves. shortcut: no expiry job; admin cancels by hand. Upgrade to a Cron Trigger if it matters.
* VNPay sandbox needs a merchant signup by the user (email confirmation).
* URL encoding differences break the VNPay hash. Use `URLSearchParams` (it encodes space as `+`) for both hash input and final URL.

## Security

* IPN routes have no session; the signature IS the authentication. Verify before any DB read.
* Never log secrets or full raw signatures (the old controller logs `rawSignature` at line 63; do not port that).
* Amount check prevents paying 1,000 VND for a 30 million VND order.

## Next

Phase 4 adds coupons, which change `totals.total` before payment.
