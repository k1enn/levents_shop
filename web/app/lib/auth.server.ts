import { createHmac } from "node:crypto";
import { data, redirect } from "react-router";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ddb, get, queryPk, TABLE } from "./db.server";
import { env } from "./env.server";
import { UserError } from "./errors";
import { getSession } from "./session.server";

// Cognito owns email + password + PIN. DynamoDB keeps the profile, keyed by the Cognito sub.
export type User = { _id: string; email: string; name: string; isAdmin: boolean; createdAt: string };
const USER = "USER";
const safe = ({ _id, email, name, isAdmin, createdAt }: User) => ({ _id, email, name, isAdmin, createdAt });

const idp = new CognitoIdentityProviderClient({});
const ClientId = env.COGNITO_CLIENT_ID;
// Client secret: Cognito rejects calls without it, so nobody can hit SignUp/Resend directly and skip Turnstile + rate limit.
const hash = (user: string) => createHmac("sha256", env.COGNITO_CLIENT_SECRET).update(user + ClientId).digest("base64");

const MESSAGES: Record<string, string> = {
  NotAuthorizedException: "Email hoặc mật khẩu sai, hoặc mã đã hết hạn. Đăng nhập lại.",
  UsernameExistsException: "Email đã được dùng.",
  InvalidPasswordException: "Mật khẩu cần ít nhất 8 ký tự.",
  CodeMismatchException: "Mã không đúng.",
  ExpiredCodeException: "Mã đã hết hạn, yêu cầu mã mới.",
  LimitExceededException: "Bạn thao tác quá nhanh, thử lại sau.",
  TooManyRequestsException: "Bạn thao tác quá nhanh, thử lại sau.",
  TooManyFailedAttemptsException: "Sai quá nhiều lần, thử lại sau.",
  CodeDeliveryFailureException: "Không gửi được email, thử lại sau.",
};

// Known Cognito errors become UserError (shown in the form). Anything else stays a 500.
async function call<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? MESSAGES[e.name] : undefined;
    throw msg ? new UserError(msg) : e;
  }
}

export const signUp = (email: string, password: string, name: string) =>
  call(() => idp.send(new SignUpCommand({ ClientId, SecretHash: hash(email), Username: email, Password: password, UserAttributes: [{ Name: "email", Value: email }, { Name: "name", Value: name }] })));

export const confirmSignUp = (email: string, code: string) => call(() => idp.send(new ConfirmSignUpCommand({ ClientId, SecretHash: hash(email), Username: email, ConfirmationCode: code })));

// Step 1: password. Cognito then emails the PIN. "unconfirmed": the sign up code was never entered, a new one is sent.
export async function startLogin(email: string, password: string): Promise<{ session: string } | "unconfirmed"> {
  try {
    const r = await call(() => idp.send(new InitiateAuthCommand({ ClientId, AuthFlow: "USER_PASSWORD_AUTH", AuthParameters: { USERNAME: email, PASSWORD: password, SECRET_HASH: hash(email) } })));
    if (r.ChallengeName !== "EMAIL_OTP" || !r.Session) throw new Error(`Unexpected Cognito challenge: ${r.ChallengeName}`);
    return { session: r.Session };
  } catch (e) {
    if (!(e instanceof Error && e.name === "UserNotConfirmedException")) throw e;
    await call(() => idp.send(new ResendConfirmationCodeCommand({ ClientId, SecretHash: hash(email), Username: email })));
    return "unconfirmed";
  }
}

// Step 2: PIN. Returns the user id and creates the profile on first login.
export async function finishLogin(email: string, session: string, code: string) {
  const r = await call(() =>
    idp.send(new RespondToAuthChallengeCommand({ ClientId, ChallengeName: "EMAIL_OTP", Session: session, ChallengeResponses: { USERNAME: email, EMAIL_OTP_CODE: code, SECRET_HASH: hash(email) } })),
  );
  const idToken = r.AuthenticationResult?.IdToken;
  if (!idToken) throw new Error(`Unexpected Cognito challenge: ${r.ChallengeName}`);
  // No signature check needed: the token came straight from Cognito over TLS, never from the browser.
  const claims = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString()) as { sub: string; email: string; name?: string };
  await ensureUser({ _id: claims.sub, email: claims.email, name: claims.name ?? claims.email, isAdmin: false, createdAt: new Date().toISOString() });
  return claims.sub;
}

async function ensureUser(u: User) {
  try {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: USER, SK: u._id, ...u }, ConditionExpression: "attribute_not_exists(PK)" }));
  } catch (e) {
    if (!(e instanceof Error && e.name === "ConditionalCheckFailedException")) throw e;
  }
}

export async function getUser(request: Request) {
  const userId = (await getSession(request)).get("userId");
  const u = userId ? await get<User>(USER, userId) : undefined;
  return u ? safe(u) : null;
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
