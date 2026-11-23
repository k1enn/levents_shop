import { createCookieSessionStorage } from "react-router";
import { env } from "./env.server";

export type CartLine = { sku: string; qty: number };

const storage = createCookieSessionStorage<{ userId: string; cart: CartLine[] }>({
  cookie: {
    name: "__session",
    httpOnly: true,
    secure: env.APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secrets: [env.SESSION_SECRET],
  },
});

export const getSession = (request: Request) => storage.getSession(request.headers.get("Cookie"));
export const { commitSession, destroySession } = storage;
export const setCookie = async (session: Awaited<ReturnType<typeof getSession>>) => ({ "Set-Cookie": await commitSession(session) });
