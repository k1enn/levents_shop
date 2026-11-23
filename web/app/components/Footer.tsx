import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="mt-8 bg-gray-900 p-6 text-sm text-gray-300">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-4">
        <span>© PhoneShop</span>
        <Link to="/thu-cu-doi-moi">Thu cũ đổi mới</Link>
        <Link to="/bao-hanh">Tra cứu bảo hành</Link>
        <Link to="/compare">So sánh</Link>
        <Link to="/orders">Đơn hàng</Link>
      </div>
    </footer>
  );
}
