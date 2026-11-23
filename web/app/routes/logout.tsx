import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySession, getSession } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  throw redirect("/", { headers: { "Set-Cookie": await destroySession(await getSession(request)) } });
}

export const loader = () => redirect("/");
