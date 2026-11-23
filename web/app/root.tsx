import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./app.css";
import { env } from "./lib/env.server";
import { safeEqual } from "./lib/crypto.server";

// Lambda is reachable only through CloudFront, which adds this header. Skipped locally (no ORIGIN_SECRET).
export const middleware: Route.MiddlewareFunction[] = [
  ({ request }) => {
    if (env.ORIGIN_SECRET && !safeEqual(request.headers.get("x-origin-secret") ?? "", env.ORIGIN_SECRET)) throw new Response("Forbidden", { status: 403 });
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap" },
];

// No root loader on purpose: catalog pages are edge cached, so per user data comes from /me on the client.
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Lỗi";
  let details = "Đã có lỗi xảy ra.";
  if (isRouteErrorResponse(error)) {
    message = String(error.status);
    details = error.status === 404 ? "Không tìm thấy trang." : String(error.data || error.statusText || details);
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }
  return (
    <div className="card">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p>{details}</p>
    </div>
  );
}
