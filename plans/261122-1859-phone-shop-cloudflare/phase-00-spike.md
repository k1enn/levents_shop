# Phase 0: Spike (Worker + Atlas + limits)

Priority: P1. Status: Pending. Effort: 2h.

## Overview

Prove the 4 biggest unknowns with a throwaway route before building anything: driver connects from a Worker, real latency from Vietnam, CPU time on the free plan, and how to read bindings on React Router v8. The scaffold created here is kept and becomes the app.

## Key insights

* Driver `mongodb` 6.15.0+ works on Workers with `nodejs_compat` and compatibility date `2025-03-20` or later (verified, Cloudflare docs).
* A Worker cannot reuse a TCP connection across requests. Create the client per request and close it after the response.
* `context.cloudflare.env` is the v7 pattern and may not work on v8 (2 of 3 votes). Try `import { env } from "cloudflare:workers"` first.
* With a v8 project do NOT set `future.v8_viteEnvironmentApi`.

## Steps

1. Scaffold: `npm create cloudflare@latest -- web --framework=react-router` in the repo root. Do not deploy from the wizard.
2. `web/wrangler.jsonc`: set current `compatibility_date`, `compatibility_flags: ["nodejs_compat"]`, `observability: { enabled: true }`.
3. User: create Atlas M0 cluster in AWS Singapore (`ap-southeast-1`), DB user, network access `0.0.0.0/0`.
4. `web/.dev.vars` (gitignored) with `MONGODB_URI`. Add `.dev.vars` to `.gitignore` if the template did not.
5. `npm i mongodb` in `web/`.
6. Create `web/app/lib/db.server.ts`:

```ts
import { MongoClient } from "mongodb";
import { env } from "cloudflare:workers";

// 1 client per request: Workers cannot share sockets across requests.
export async function withDb<T>(fn: (db: import("mongodb").Db) => Promise<T>): Promise<T> {
  const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000 });
  try {
    return await fn(client.db("phoneshop"));
  } finally {
    await client.close();
  }
}
```

7. Route `web/app/routes/health.tsx`: loader runs `ping`, 1 `findOne`, 1 transaction (`client.startSession().withTransaction`) on a temp collection, and 1 PBKDF2 hash at 10,000 iterations. Return each duration in ms as JSON.
8. `npx wrangler dev`, open `/health`. Then `npx wrangler deploy` and `npx wrangler secret put MONGODB_URI`.
9. Measure from a Vietnam network: `for i in $(seq 10); do curl -s -o /dev/null -w "%{time_total}\n" https://<worker>/health; done`.
10. Read CPU time for `/health` and for the default SSR home page in Workers Logs (dashboard).
11. Write the 4 numbers into the "Results" section below.

## Todo

- [ ] Scaffold `web/` and configure wrangler
- [ ] Atlas M0 Singapore ready (user)
- [ ] `withDb` helper + `/health` route
- [ ] Deployed and measured
- [ ] Results recorded, gates decided

## Success criteria and gates

* `/health` returns ok locally and deployed.
* Gate A (bindings): `cloudflare:workers` env import works in a loader. If not, use the v8 context API and note the pattern here.
* Gate B (CPU): SSR page CPU p50 under 10 ms on free plan. If not: user chooses Workers Paid or accepts errors under load.
* Gate C (latency): `/health` total p50. Under 600 ms: keep direct connection. Above: schedule the Durable Object step in phase 6.
* Gate D (transaction): works from a Worker. If not, phase 2 uses conditional updates with manual rollback.
* Gate E (hash): PBKDF2 at 10,000 iterations costs under 5 ms CPU. If more, lower the constant.

## Results

Local only (2026-11-23, Docker MongoDB 8 replica set, `wrangler dev`). Production numbers still needed.

* Gate A (bindings): PASS. `import { env } from "cloudflare:workers"` works in loaders.
* Gate D (transaction): PASS. `withTransaction` works from workerd; last unit race gives exactly 1 order.
* Gate E (hash): PBKDF2 10,000 iterations about 2 ms wall time locally. Confirm CPU in Workers Logs.
* Gates B, C: OPEN. Need deploy + Atlas. `/health` was removed per plan; measure with `curl` on `/phones/<slug>` and read CPU in Workers Logs.
* Found: `npm run dev` (Vite dev) fails with `require("punycode/")` from the mongodb driver. Production build is fine. Use `npm run local` (build + `wrangler dev`).
* Changed: 1 Mongo client per request (AsyncLocalStorage), shared by all loaders, closed after the response.

## Risks

* M0 cold cluster or DNS SRV lookup makes the first request slow. Run 10 requests, ignore the first.
* Compatibility flags differ by date. If the driver fails to import, check the Cloudflare MongoDB page first.

## Security

* `MONGODB_URI` only in `.dev.vars` and Wrangler secrets. Never committed.
* Remove the `/health` route at the end of phase 1 (it exposes timing and DB access).

## Next

Phase 1 reuses `withDb` and the scaffold.
