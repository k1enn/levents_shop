import { Link } from "react-router";

const COLS: [string, [string, string][]][] = [
  ["Khám phá", [["/phones", "Điện thoại"], ["/compare", "So sánh"], ["/thu-cu-doi-moi", "Thu cũ đổi mới"]]],
  ["Tài khoản", [["/profile", "Hồ sơ"], ["/orders", "Đơn hàng"], ["/cart", "Giỏ hàng"]]],
  ["Hỗ trợ khách hàng", [["/bao-hanh", "Tra cứu bảo hành"], ["/thu-cu-doi-moi", "Định giá máy cũ"]]],
];

export function Footer() {
  return (
    <footer className="bg-[#f8f9fa] py-6 text-xs text-black">
      <div className="wrap">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h6 className="mb-3 font-bold">Liên hệ với chúng tôi:</h6>
            <p>Hotline: 1800636516</p>
            <p>Trả góp 0% · Bảo hành 12 tháng</p>
          </div>
          {COLS.map(([title, links]) => (
            <div key={title}>
              <h6 className="mb-3 font-bold">{title}</h6>
              <ul className="flex flex-col gap-1">
                {links.map(([to, label]) => (
                  <li key={to + label}>
                    <Link to={to}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-black/10 pt-3 text-center">Copyright © PhoneShop</p>
      </div>
    </footer>
  );
}
