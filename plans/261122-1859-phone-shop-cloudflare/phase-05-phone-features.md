# Phase 5: Phone features (installment, trade in, IMEI warranty)

Priority: P2. Status: Pending. Effort: 5h. Needs: phase 2 (orders, admin).

## Overview

Simple versions, as agreed: no third party API. Installment and trade in are a calculator plus a request form that staff follow up by phone. Warranty is a lookup by IMEI.

## Architecture

Installment and trade in requests share 1 collection and 1 admin page (DRY):

```ts
leads: { _id, type: "installment" | "tradein", fullName, phone,
         payload: object,   // installment: { sku, months, downPercent, monthly }  tradein: { model, condition, quote }
         status: "new" | "contacted" | "closed", createdAt }
```

### Installment

* `app/lib/installment.ts`: pure function.

```ts
// flat rate model: monthly = (price - down) * (1 + ratePerMonth * months) / months
export function monthlyPayment(price: number, downPercent: number, months: number, ratePerMonth: number): number
```

* Options are constants: months `[6, 9, 12]`, down payment `[0, 30, 50]` percent, rate `0` for the "0%" plan and `0.015` for the normal plan.
* Shown on the detail page under the price for the selected variant. Form posts name + phone and creates a lead.
* Label it clearly as an estimate ("Tam tinh").

### Trade in

* Route `routes/thu-cu-doi-moi.tsx`.
* `app/data/trade-in-prices.ts`: static list `{ model, basePrice }` for about 20 old models. shortcut: static file, move to a collection when staff need to edit prices without a deploy.
* Condition grades: `{ "nhu moi": 1, "tot": 0.85, "tray xuoc": 0.7, "loi nhe": 0.5 }`. Quote = `basePrice * grade`.
* Form shows the quote, then name + phone creates a lead.

### IMEI and warranty

* Admin, when moving an order to `shipping`, must enter an IMEI for every unit (phase 2 schema already has `items.imei`; for qty above 1 store `imeis: string[]`).
* Validate: 15 digits + Luhn check. Unique across orders (index `items.imeis`, checked in the action).
* Route `routes/bao-hanh.tsx`: form with 1 IMEI. Loader finds the order item, returns ONLY: model name, purchase date, warranty end (delivered date + 12 months), active or expired.
* Warranty length is 1 constant (12 months).

## Files

Create in `web/app/`: `lib/installment.ts`, `lib/leads.server.ts`, `lib/imei.ts` (Luhn), `data/trade-in-prices.ts`, `routes/thu-cu-doi-moi.tsx`, `routes/bao-hanh.tsx`, `routes/admin.leads.tsx`, `components/InstallmentBox.tsx`.

Modify: `routes/phones.$slug.tsx` (installment box), `routes/admin.orders.tsx` (IMEI input on the shipping step), `components/Header.tsx` and `Footer.tsx` (links).

## Todo

- [ ] `leads` collection + admin page
- [ ] Installment calculator + form
- [ ] Trade in quote + form
- [ ] IMEI capture in admin orders
- [ ] Warranty lookup page

## Success criteria

* Installment: 12,000,000 VND, 0 down, 12 months, rate 0 gives 1,000,000 per month. With rate 0.015 it gives 1,180,000.
* Lead appears in admin with the right type and payload; status can be changed.
* IMEI `490154203237518` (valid Luhn) accepted; `490154203237519` rejected; a duplicate rejected.
* An order cannot move to `shipping` with a missing IMEI.
* Warranty lookup shows model and dates only, no buyer name, phone or address.

## Risks

* The calculator is not a real finance offer. The "Tam tinh" label avoids a misleading claim.
* Trade in prices go stale. Accepted for a portfolio.

## Security

* The lead forms and the IMEI lookup are public and unauthenticated: they get Turnstile or a rate limit in phase 6. Until then they are open to spam and IMEI guessing.
* Lookup response is minimal on purpose so a guessed IMEI leaks no personal data.
* Phone number validated (Vietnam format, 10 digits starting with 0).

## Next

Phase 6 protects these public forms and ships the app.
