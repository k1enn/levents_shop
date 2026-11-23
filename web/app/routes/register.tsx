import { redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/register";
import { createUser } from "~/lib/auth.server";
import { hashPassword } from "~/lib/password.server";
import { getSession, setCookie } from "~/lib/session.server";
import { guard } from "~/lib/guard.server";
import { email, safeNext, str } from "~/lib/validate";
import { AuthForm } from "./login";

export const meta: Route.MetaFunction = () => [{ title: "Đăng ký - PhoneShop" }];

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  await guard(request, fd, "register");
  const mail = email(fd);
  const name = str(fd, "name", 80);
  const pw = str(fd, "password", 200);
  if (!mail || !name || !pw || pw.length < 8) return { error: "Nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự." };
  const _id = crypto.randomUUID();
  const passwordHash = await hashPassword(pw);
  if (!(await createUser({ _id, email: mail, name, passwordHash, isAdmin: false, createdAt: new Date().toISOString() }))) return { error: "Email đã được dùng." };
  const session = await getSession(request);
  session.set("userId", _id);
  throw redirect(safeNext(new URL(request.url).searchParams.get("next")), { headers: await setCookie(session) });
}

export default function Register({ actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  return <AuthForm title="Đăng ký" register error={actionData?.error} next={sp.get("next")} />;
}
