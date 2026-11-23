import { useRef, useState } from "react";
import { Link } from "react-router";

// Edge to edge slider: native scroll snap, dots scroll the track. No autoplay on purpose.
export function Banner({ slides }: { slides: { to: string; image: string; alt: string }[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  if (!slides.length) return null;
  const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });
  return (
    <section className="full-bleed -mt-4 mb-8">
      <div
        ref={track}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {slides.map((s) => (
          <Link key={s.to} to={s.to} className="w-full shrink-0 snap-start bg-muted">
            <img src={s.image} alt={s.alt} className="h-[200px] w-full object-contain md:h-[400px]" />
          </Link>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button key={s.to} type="button" onClick={() => go(i)} aria-label={`Ảnh ${i + 1}`} className={`h-1 w-8 ${i === idx ? "bg-black" : "bg-black/20"}`} />
        ))}
      </div>
    </section>
  );
}
