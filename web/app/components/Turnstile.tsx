import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string }) => string; remove: (id: string) => void };
  }
}

// Public site key. Default is Cloudflare's always-pass test key for local dev.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Explicit render so it also works after client side navigation. Adds the hidden cf-turnstile-response input.
export function Turnstile() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    const render = () => ref.current && window.turnstile && (id = window.turnstile.render(ref.current, { sitekey: SITE_KEY }));
    if (window.turnstile) render();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
      if (!s) {
        s = Object.assign(document.createElement("script"), { src: SRC, async: true });
        document.head.appendChild(s);
      }
      s.addEventListener("load", render);
    }
    return () => {
      if (id) window.turnstile?.remove(id);
    };
  }, []);
  return <div ref={ref} />;
}
