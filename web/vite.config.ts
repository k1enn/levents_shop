import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { defineConfig, type Plugin } from "vite";

const SEED = join(import.meta.dirname, "seed-images");
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", svg: "image/svg+xml" };

// Dev only: serve /images/seed/* from seed-images/ so seeded products and banners show without S3.
const seedImages: Plugin = {
  name: "seed-images",
  configureServer(server) {
    server.middlewares.use("/images/seed", async (req, res, next) => {
      const file = normalize(join(SEED, decodeURIComponent(req.url!.split("?")[0])));
      if (!file.startsWith(SEED + "/")) return next();
      try {
        const body = await readFile(file);
        res.setHeader("Content-Type", TYPES[file.split(".").pop()!] ?? "application/octet-stream");
        res.end(body);
      } catch {
        next();
      }
    });
  },
};

export default defineConfig({
  plugins: [seedImages, tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // Local dev: other images live in S3 behind CloudFront (CDN_URL from `terraform output -raw url`).
  server: process.env.CDN_URL ? { proxy: { "/images": { target: process.env.CDN_URL, changeOrigin: true } } } : {},
});
