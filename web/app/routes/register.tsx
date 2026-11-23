import { redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/register";
import { confirmSignUp, signUp } from "~/lib/auth.server";
import { userErrors } from "~/lib/errors";
import { guard, limit } from "~/lib/guard.server";
import { email, str } from "~/lib/validate";
import { AuthForm, CodeForm } from "./login";

export const meta: Route.MetaFunction = () => [{ title: "Đăng ký - PhoneShop" }];

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  const mail = email(fd);
  if (fd.get("intent") === "confirm") {
    await limit(request, "register-confirm");
    const code = str(fd, "code", 10);
    if (!mail) return { error: "Email không hợp lệ." };
    if (!code) return { error: "Nhập mã gồm 6 số.", step: "confirm", email: mail };
    const r = await userErrors(() => confirmSignUp(mail, code));
    if ("error" in r) return { ...r, step: "confirm", email: mail };
    const next = new URL(request.url).searchParams.get("next");
    // Login right after asks for a 2nd code (MFA). Accepted: 1 flow, no Cognito auto sign in.
    throw redirect(`/login?verified=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  await guard(request, fd, "register");
  const name = str(fd, "name", 80);
  const pw = str(fd, "password", 200);
  if (!mail || !name || !pw || pw.length < 8) return { error: "Nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự." };
  const r = await userErrors(() => signUp(mail, pw, name));
  if ("error" in r) return r;
  return { step: "confirm", email: mail };
}

export default function Register({ actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  const d = actionData as { step?: "confirm"; email?: string; error?: string } | undefined;
  if (d?.step === "confirm") return <CodeForm action="/register" intent="confirm" title="Xác minh email" email={d.email!} error={d.error} next={sp.get("next")} />;
  return <AuthForm title="Đăng ký" register error={d?.error} next={sp.get("next")} />;
}
