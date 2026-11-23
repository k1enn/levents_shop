import { Form, Link, redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { finishLogin, startLogin } from "~/lib/auth.server";
import { userErrors } from "~/lib/errors";
import { getSession, setCookie } from "~/lib/session.server";
import { guard, limit } from "~/lib/guard.server";
import { email, safeNext, str } from "~/lib/validate";
import { Turnstile } from "~/components/Turnstile";

export const meta: Route.MetaFunction = () => [{ title: "Đăng nhập - PhoneShop" }];

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  const mail = email(fd);
  if (fd.get("intent") === "otp") {
    await limit(request, "login-otp");
    const session = str(fd, "session", 4000);
    const code = str(fd, "code", 10);
    if (!mail || !session) return { error: "Phiên đăng nhập hết hạn, đăng nhập lại." };
    if (!code) return { error: "Nhập mã gồm 6 số.", step: "otp", email: mail, session };
    const userId = await userErrors(() => finishLogin(mail, session, code));
    if (typeof userId !== "string") return { ...userId, step: "otp", email: mail, session };
    const s = await getSession(request);
    s.set("userId", userId);
    throw redirect(safeNext(new URL(request.url).searchParams.get("next")), { headers: await setCookie(s) });
  }
  await guard(request, fd, "login");
  const pw = str(fd, "password", 200);
  if (!mail || !pw) return { error: "Email hoặc mật khẩu sai." };
  const r = await userErrors(() => startLogin(mail, pw));
  if (r === "unconfirmed") return { step: "confirm", email: mail };
  if ("error" in r) return r;
  return { step: "otp", email: mail, session: r.session };
}

type Step = { step?: "otp" | "confirm"; email?: string; session?: string; error?: string };

export default function Login({ actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  const d = actionData as Step | undefined;
  const next = sp.get("next");
  if (d?.step === "otp") return <CodeForm action="/login" intent="otp" title="Nhập mã đăng nhập" email={d.email!} session={d.session} error={d.error} next={next} />;
  if (d?.step === "confirm") return <CodeForm action="/register" intent="confirm" title="Xác minh email" email={d.email!} error={d.error} next={next} />;
  return <AuthForm title="Đăng nhập" error={d?.error} notice={sp.has("verified") ? "Xác minh thành công, mời đăng nhập." : undefined} next={next} />;
}

// Code step for both sign up (confirm) and sign in (otp). Cognito emails the 6 digit code.
export function CodeForm({ action, intent, title, email, session, error, next }: { action: string; intent: string; title: string; email: string; session?: string; error?: string; next: string | null }) {
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <Form method="post" action={action + qs} className="mx-auto flex w-full max-w-[540px] flex-col gap-3 py-4">
      <h1>{title}</h1>
      <p className="text-sm">Mã gồm 6 số đã được gửi tới {email}.</p>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="email" value={email} />
      {session && <input type="hidden" name="session" value={session} />}
      <input name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" autoFocus placeholder="Mã xác minh" aria-label="Mã xác minh" className="input" />
      {error && <p className="err">{error}</p>}
      <button className="btn">Xác nhận</button>
      <Link to={`/login${qs}`} className="text-sm underline">Không nhận được mã? Đăng nhập lại</Link>
    </Form>
  );
}

export function AuthForm({ title, error, notice, next, register }: { title: string; error?: string; notice?: string; next: string | null; register?: boolean }) {
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <Form method="post" action={`${register ? "/register" : "/login"}${qs}`} className="mx-auto flex w-full max-w-[540px] flex-col gap-3 py-4">
      <h1>{title}</h1>
      {notice && <p className="text-sm text-green-700">{notice}</p>}
      {register && <input name="name" required maxLength={80} placeholder="Họ tên" className="input" />}
      <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
      <input name="password" type="password" required minLength={register ? 8 : undefined} placeholder="Mật khẩu" className="input" autoComplete={register ? "new-password" : "current-password"} />
      <Turnstile />
      {error && <p className="err">{error}</p>}
      <button className="btn">{title}</button>
      {register ? (
        <Link to={`/login${qs}`} className="text-sm underline">Đã có tài khoản? Đăng nhập</Link>
      ) : (
        <Link to={`/register${qs}`} className="text-sm underline">Chưa có tài khoản? Đăng ký</Link>
      )}
    </Form>
  );
}
