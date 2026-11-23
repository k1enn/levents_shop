import type { Route } from "./+types/sitemap[.]xml";
import { activeProducts } from "~/lib/products.server";

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const slugs = await activeProducts();
  const urls = ["/", "/phones", ...slugs.map((p) => `/phones/${p.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${origin}${u}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
}
