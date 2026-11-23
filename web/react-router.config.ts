import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // CloudFront sends the Lambda URL as Host, so Origin never matches and actions 400.
  // shortcut: any *.cloudfront.net passes (SameSite=lax + Turnstile still block CSRF), set the real domain once there is one.
  allowedActionOrigins: ["*.cloudfront.net"],
} satisfies Config;
