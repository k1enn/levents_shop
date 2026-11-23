import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("phones", "routes/phones._index.tsx"),
  route("phones/:slug", "routes/phones.$slug.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
  route("robots.txt", "routes/robots[.]txt.tsx"),
  route("compare", "routes/compare.tsx"),
  route("thu-cu-doi-moi", "routes/thu-cu-doi-moi.tsx"),
  route("bao-hanh", "routes/bao-hanh.tsx"),

  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  route("profile", "routes/profile.tsx"),
  route("me", "routes/me.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("orders", "routes/orders._index.tsx"),
  route("orders/:code", "routes/orders.$code.tsx"),

  route("pay/:code", "routes/pay.$code.tsx"),
  route("api/momo/ipn", "routes/api.momo.ipn.tsx"),
  route("api/vnpay/ipn", "routes/api.vnpay.ipn.tsx"),
  route("payment/return", "routes/payment.return.tsx"),

  route("admin", "routes/admin.tsx", [
    route("products", "routes/admin.products._index.tsx"),
    route("products/:id", "routes/admin.products.$id.tsx"),
    route("orders", "routes/admin.orders.tsx"),
    route("users", "routes/admin.users.tsx"),
    route("coupons", "routes/admin.coupons.tsx"),
    route("leads", "routes/admin.leads.tsx"),
  ]),
] satisfies RouteConfig;
