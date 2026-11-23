import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { env } from "./env.server";

// Catalog pages: short edge TTL, long stale window. No s-maxage, it turns off stale-while-revalidate.
export const CATALOG_CACHE = "public, max-age=60, stale-while-revalidate=600";

const cf = new CloudFrontClient({});

// Awaited, not fire and forget: Lambda freezes after the response. A failed purge only means up to 60 s
// of stale price or stock (place order rechecks stock). /phones* also covers every product page.
export async function purge() {
  if (!env.DISTRIBUTION_ID) return;
  const Items = ["/", "/_root.data", "/phones*"];
  await cf
    .send(new CreateInvalidationCommand({ DistributionId: env.DISTRIBUTION_ID, InvalidationBatch: { CallerReference: `${Date.now()}-${Math.random()}`, Paths: { Quantity: Items.length, Items } } }))
    .catch((e) => console.error("cache purge failed", e));
}
