import { Form, Link, redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { findByEmail } from "~/lib/auth.server";
import { verifyPassword } from "~/lib/password.server";
import { getSession, setCookie } from "~/lib/session.server";
import { guard } from "~/lib/guard.server";
import { email, safeNext, str } from "~/lib/validate";
import { Turnstile } from "~/components/Turnstile";

export const meta: Route.MetaFunction = () => [{ title: "Đăng nhập - PhoneShop" }];

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  await guard(request, fd, "login");
  const mail = email(fd);
  const pw = str(fd, "password", 200);
  const user = mail && pw ? await findByEmail(mail) : null;
  // 1 generic message: do not reveal which emails exist.
  if (!user || !(await verifyPassword(pw!, user.passwordHash))) return { error: "Email hoặc mật khẩu sai." };
  const session = await getSession(request);
  session.set("userId", user._id);
  throw redirect(safeNext(new URL(request.url).searchParams.get("next")), { headers: await setCookie(session) });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  return <AuthForm title="Đăng nhập" error={actionData?.error} next={sp.get("next")} />;
}

export function AuthForm({ title, error, next, register }: { title: string; error?: string; next: string | null; register?: boolean }) {
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <Form method="post" action={`${register ? "/register" : "/login"}${qs}`} className="card mx-auto flex max-w-sm flex-col gap-3">
      <h1 className="text-xl font-bold">{title}</h1>
      {register && <input name="name" required maxLength={80} placeholder="Họ tên" className="input" />}
      <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
      <input name="password" type="password" required minLength={register ? 8 : undefined} placeholder="Mật khẩu" className="input" autoComplete={register ? "new-password" : "current-password"} />
      <Turnstile />
      {error && <p className="err">{error}</p>}
      <button className="btn">{title}</button>
      {register ? (
        <Link to={`/login${qs}`} className="text-sm text-blue-600">Đã có tài khoản? Đăng nhập</Link>
      ) : (
        <Link to={`/register${qs}`} className="text-sm text-blue-600">Chưa có tài khoản? Đăng ký</Link>
      )}
    </Form>
  );
}
