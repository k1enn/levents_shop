import type { Route } from "./+types/me";
import { getUser } from "~/lib/auth.server";
import { getSession } from "~/lib/session.server";

// Per user header state. Never cached, so catalog pages can be.
export async function loader({ request }: Route.LoaderArgs) {
  const [user, session] = await Promise.all([getUser(request), getSession(request)]);
  const cartCount = (session.get("cart") ?? []).reduce((s, l) => s + l.qty, 0);
  return Response.json(user ? { name: user.name, isAdmin: user.isAdmin, cartCount } : { name: null, cartCount }, { headers: { "Cache-Control": "private, no-store" } });
}
