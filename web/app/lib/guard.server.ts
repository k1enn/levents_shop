import { data } from "react-router";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "./db.server";
import { env } from "./env.server";

// CloudFront-Viewer-Address is "ip:port" (IPv6 has colons too, so cut at the last one).
export function ip(request: Request) {
  const v = request.headers.get("CloudFront-Viewer-Address");
  return v ? v.slice(0, v.lastIndexOf(":")) : "local";
}

const LIMIT = 10; // per IP + name, per minute

// Rate limit with 1 counter item per minute, removed by TTL. Throws 429 so actions stay 1 line.
export async function limit(request: Request, name: string) {
  const minute = Math.floor(Date.now() / 60_000);
  const r = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `RATE#${name}#${ip(request)}`, SK: String(minute) },
      UpdateExpression: "ADD n :one SET #ttl = :exp",
      ExpressionAttributeNames: { "#ttl": "ttl" },
      ExpressionAttributeValues: { ":one": 1, ":exp": minute * 60 + 120 },
      ReturnValues: "UPDATED_NEW",
    }),
  );
  if (Number(r.Attributes?.n) > LIMIT) throw data("Bạn thao tác quá nhanh, thử lại sau 1 phút.", { status: 429 });
}

// Turnstile check for public forms. Throws 400 when the token is missing or invalid.
export async function verifyTurnstile(request: Request, fd: FormData) {
  const token = fd.get("cf-turnstile-response");
  if (typeof token === "string" && token) {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip(request) });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    if (((await res.json()) as { success: boolean }).success) return;
  }
  throw data("Xác minh chống bot thất bại, tải lại trang.", { status: 400 });
}

// Both checks, for every public write form.
export async function guard(request: Request, fd: FormData, name: string) {
  await limit(request, name);
  await verifyTurnstile(request, fd);
}
