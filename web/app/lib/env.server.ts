import { GetParametersByPathCommand, SSMClient } from "@aws-sdk/client-ssm";

const KEYS = ["SESSION_SECRET", "ORIGIN_SECRET", "APP_URL", "TABLE", "BUCKET", "DISTRIBUTION_ID", "MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY", "VNP_TMN_CODE", "VNP_HASH_SECRET", "COGNITO_CLIENT_ID", "COGNITO_CLIENT_SECRET", "TURNSTILE_SECRET"] as const;
const REQUIRED = ["SESSION_SECRET", "APP_URL", "TABLE", "COGNITO_CLIENT_ID", "COGNITO_CLIENT_SECRET", "TURNSTILE_SECRET"] as const;

// Lambda: SSM params under SSM_PREFIX, once per cold start. Local: .env (never in git).
async function load() {
  const src: Record<string, string | undefined> = {};
  const prefix = process.env.SSM_PREFIX;
  if (prefix) {
    const ssm = new SSMClient({});
    let NextToken: string | undefined;
    do {
      const r = await ssm.send(new GetParametersByPathCommand({ Path: prefix, WithDecryption: true, NextToken }));
      for (const p of r.Parameters ?? []) src[p.Name!.slice(prefix.length + 1)] = p.Value;
      NextToken = r.NextToken;
    } while (NextToken);
  } else {
    try {
      process.loadEnvFile(".env");
    } catch {}
    Object.assign(src, process.env);
  }
  // A bad deploy fails loudly on the first request instead of half working.
  const missing = REQUIRED.filter((k) => !src[k]);
  if (missing.length) throw new Error(`Missing config: ${missing.join(", ")}`);
  return Object.fromEntries(KEYS.map((k) => [k, src[k] ?? ""])) as Record<(typeof KEYS)[number], string>;
}

export const env = await load();
