import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // Local dev: images live in S3 behind CloudFront (CDN_URL from `terraform output -raw url`).
  server: process.env.CDN_URL ? { proxy: { "/images": { target: process.env.CDN_URL, changeOrigin: true } } } : {},
});
