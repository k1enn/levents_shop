import { Link } from "react-router";

const brandUrl = (b: string) => `/phones?brand=${encodeURIComponent(b)}`;

// One tile per brand, cover = first product image of that brand.
export function CategoryGrid({ covers }: { covers: [brand: string, image: string][] }) {
  return (
    <section className="my-12">
      <h1 className="text-center">Đa dạng thương hiệu</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {covers.map(([b, img]) => (
          <Link key={b} to={brandUrl(b)} className="group">
            <div className="aspect-square overflow-hidden bg-muted">
              <img src={`/images/${img}`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </div>
            <h3 className="p-3 text-center">{b}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Pill links. active undefined = "Tất cả" selected.
export function CategoryBar({ brands, active }: { brands: string[]; active?: string }) {
  const pill = (on: boolean) =>
    `w-[120px] rounded-lg px-4 py-2 text-center font-medium transition hover:-translate-y-px ${on ? "bg-black text-white shadow-[0_4px_8px_rgba(0,0,0,0.3)]" : "bg-black/[0.02] text-black"}`;
  return (
    <nav className="flex flex-wrap justify-center gap-2" aria-label="Thương hiệu">
      <Link to="/phones" className={pill(!active)}>Tất cả</Link>
      {brands.map((b) => (
        <Link key={b} to={brandUrl(b)} className={pill(b === active)}>{b}</Link>
      ))}
    </nav>
  );
}
