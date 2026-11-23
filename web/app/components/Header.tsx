import { useEffect } from "react";
import { Form, Link, useFetcher, useLocation } from "react-router";

type Me = { name: string; isAdmin: boolean; cartCount: number } | { name: null; cartCount: number };

export function Header() {
  const me = useFetcher<Me>();
  const { pathname, search } = useLocation();
  // Refetch after each navigation so cart count and login state stay fresh on cached pages.
  useEffect(() => {
    me.load("/me");
  }, [pathname, search]);
  const user = me.data;

  return (
    <header className="bg-red-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 p-3">
        <Link to="/" className="text-xl font-bold">
          PhoneShop
        </Link>
        <Form method="get" action="/phones" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <input name="q" placeholder="Bạn tìm điện thoại gì?" aria-label="Tìm kiếm" className="input text-gray-900" />
        </Form>
        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link to="/phones">Điện thoại</Link>
          <Link to="/thu-cu-doi-moi">Thu cũ</Link>
          <Link to="/cart">Giỏ hàng ({user?.cartCount ?? 0})</Link>
          {user?.name ? (
            <>
              {"isAdmin" in user && user.isAdmin && <Link to="/admin">Quản trị</Link>}
              <Link to="/profile">{user.name}</Link>
              <Form method="post" action="/logout">
                <button>Đăng xuất</button>
              </Form>
            </>
          ) : (
            <Link to="/login">Đăng nhập</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
