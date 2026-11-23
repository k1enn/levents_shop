import type { Route } from "./+types/robots[.]txt";

export function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const body = `User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /checkout
Disallow: /orders
Disallow: /api/
Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=86400" } });
}
