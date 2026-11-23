import type { Route } from "./+types/me";
import { getUser } from "~/lib/auth.server";
import { getSession } from "~/lib/session.server";
import { listBrands } from "~/lib/products.server";

// Per user header state. Never cached, so catalog pages can be.
export async function loader({ request }: Route.LoaderArgs) {
  const [user, session, brands] = await Promise.all([getUser(request), getSession(request), listBrands()]);
  const cartCount = (session.get("cart") ?? []).reduce((s, l) => s + l.qty, 0);
  return Response.json(user ? { name: user.name, isAdmin: user.isAdmin, cartCount, brands } : { name: null, cartCount, brands }, { headers: { "Cache-Control": "private, no-store" } });
}
