// Plain field readers for action and loader boundaries. Each returns a clean value or undefined.
// Works with FormData and URLSearchParams.
type Src = { get(name: string): FormDataEntryValue | null };
export const str = (fd: Src, name: string, max = 200) => {
  const v = fd.get(name);
  return typeof v === "string" && v.trim() && v.length <= max ? v.trim() : undefined;
};
export const int = (fd: Src, name: string, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const v = fd.get(name);
  const n = typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};
export const oneOf = <T extends string>(fd: Src, name: string, list: readonly T[]) => {
  const v = fd.get(name);
  return list.includes(v as T) ? (v as T) : undefined;
};
export const email = (fd: Src) => {
  const v = str(fd, "email", 120)?.toLowerCase();
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : undefined;
};
// Vietnam mobile: 10 digits starting with 0.
export const phone = (fd: Src) => {
  const v = str(fd, "phone", 15)?.replace(/\s/g, "");
  return v && /^0\d{9}$/.test(v) ? v : undefined;
};
// Only relative paths, blocks open redirects like //evil.com.
export const safeNext = (v: string | null) => (v && /^\/(?![/\\])/.test(v) ? v : "/");
