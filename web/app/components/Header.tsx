import { useEffect } from "react";
import { Form, Link, useFetcher, useLocation } from "react-router";

type Me = { cartCount: number; brands: string[] } & ({ name: string; isAdmin: boolean } | { name: null });

const ICONS = {
  search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  user: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0",
  cart: "M2.25 3h1.4l.5 1.9m0 0L6 12.75h11.25L20.25 5H4.15ZM7.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9.75 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  menu: "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5",
};
const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

const NAV = "px-3 py-2 font-medium text-black hover:text-[#495057]";

export function Header() {
  const me = useFetcher<Me>();
  const { pathname, search } = useLocation();
  // Refetch after each navigation so cart count and login state stay fresh on cached pages.
  useEffect(() => {
    me.load("/me");
  }, [pathname, search]);
  const user = me.data;

  return (
    <header className="border-b border-[#dee2e6] bg-white">
      {/* key resets the CSS only toggles (menu, account) after each navigation */}
      <div key={pathname + search} className="wrap flex flex-wrap items-center gap-2 py-2">
        <Link to="/" className="mr-4 py-2 text-[1.25rem] font-bold tracking-normal text-black md:text-[1.5rem]">
          PhoneShop
        </Link>
        <input type="checkbox" id="nav" className="peer sr-only" />
        <label htmlFor="nav" className="ml-auto cursor-pointer p-2 peer-focus-visible:ring-2 peer-focus-visible:ring-black md:hidden" aria-label="Menu">
          <Icon name="menu" />
        </label>
        <nav className="hidden w-full flex-col peer-checked:flex md:flex md:w-auto md:flex-1 md:flex-row md:flex-wrap md:items-center">
          <Link to="/phones" className={NAV}>Điện thoại</Link>
          {user?.brands.map((b) => (
            <Link key={b} to={`/phones?brand=${encodeURIComponent(b)}`} className={NAV}>{b}</Link>
          ))}
          <Link to="/thu-cu-doi-moi" className={NAV}>Thu cũ</Link>
          <Link to="/compare" className={NAV}>So sánh</Link>
          <Form method="get" action="/phones" className="flex items-center gap-1 px-3 py-2 md:ml-auto md:px-0">
            <input name="q" placeholder="Tìm kiếm..." aria-label="Tìm kiếm" className="h-[38px] w-full rounded-lg border border-[#ced4da] bg-[#f8f9fa] px-3 md:w-[200px]" />
            <button className="p-2 text-black" aria-label="Tìm">
              <Icon name="search" />
            </button>
          </Form>
          {user?.name ? (
            <details className="relative">
              <summary className={`${NAV} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
                <Icon name="user" /> {user.name}
              </summary>
              <div className="z-20 flex min-w-48 flex-col border border-black/10 bg-white py-2 md:absolute md:right-0">
                <Link to="/profile" className={NAV}>Hồ sơ</Link>
                <Link to="/orders" className={NAV}>Đơn hàng</Link>
                {"isAdmin" in user && user.isAdmin && <Link to="/admin" className={`${NAV} border-y border-black/10`}>Quản trị</Link>}
                <Form method="post" action="/logout">
                  <button className={`${NAV} w-full text-left`}>Đăng xuất</button>
                </Form>
              </div>
            </details>
          ) : (
            <Link to="/login" className={NAV} aria-label="Đăng nhập">
              <Icon name="user" />
            </Link>
          )}
          <Link to="/cart" className={`${NAV} flex items-center gap-1`} aria-label={`Giỏ hàng (${user?.cartCount ?? 0})`}>
            <Icon name="cart" /> {user?.cartCount ? <span className="rounded-full bg-black px-1.5 text-xs text-white">{user.cartCount}</span> : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
