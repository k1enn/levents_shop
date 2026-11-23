import { useEffect, useState } from "react";

// Renders nothing on the server (time differs), ticks every second on the client.
export function Countdown({ to }: { to: Date | string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono">
      {Math.floor(s / 86400)}d {pad(Math.floor(s / 3600) % 24)}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}
    </span>
  );
}
