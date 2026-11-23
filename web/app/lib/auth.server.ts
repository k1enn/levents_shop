import { data, redirect } from "react-router";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { cancelCodes, ddb, get, queryPk, TABLE } from "./db.server";
import { getSession } from "./session.server";

export type User = { _id: string; email: string; name: string; passwordHash: string; isAdmin: boolean; createdAt: string };
const USER = "USER";
const emailKey = (email: string) => ({ PK: `EMAIL#${email}`, SK: "-" });
const safe = ({ _id, email, name, isAdmin, createdAt }: User) => ({ _id, email, name, isAdmin, createdAt });

export async function getUser(request: Request) {
  const userId = (await getSession(request)).get("userId");
  const u = userId ? await get<User>(USER, userId) : undefined;
  return u ? safe(u) : null;
}

// With passwordHash, for login only.
export async function findByEmail(email: string) {
  const lock = await get<{ userId: string }>(emailKey(email).PK, "-");
  return lock ? get<User>(USER, lock.userId) : undefined;
}

// User + email lock item in 1 transaction. false when the email is taken.
export async function createUser(u: User) {
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: TABLE, Item: { PK: USER, SK: u._id, ...u }, ConditionExpression: "attribute_not_exists(PK)" } },
          { Put: { TableName: TABLE, Item: { ...emailKey(u.email), userId: u._id }, ConditionExpression: "attribute_not_exists(PK)" } },
        ],
      }),
    );
    return true;
  } catch (e) {
    if (cancelCodes(e)?.[1] === "ConditionalCheckFailed") return false;
    throw e;
  }
}

export const listUsers = async () => (await queryPk<User>(USER)).map(safe).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    const { pathname, search } = new URL(request.url);
    throw redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  return user;
}

// 404, not 403: do not reveal that admin pages exist.
export async function requireAdmin(request: Request) {
  const user = await getUser(request);
  if (!user?.isAdmin) throw data("Not Found", { status: 404 });
  return user;
}
