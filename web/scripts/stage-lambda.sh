#!/bin/sh
# Copies the build + prod node_modules into infra/app/.lambda for Terraform to zip.
set -e
cd "$(dirname "$0")/.."
rm -rf ../infra/app/.lambda
mkdir -p ../infra/app/.lambda
cp -r build package.json package-lock.json ../infra/app/.lambda/
printf '#!/bin/sh\nexec node node_modules/@react-router/serve/bin.cjs build/server/index.js\n' > ../infra/app/.lambda/run.sh
chmod +x ../infra/app/.lambda/run.sh
cd ../infra/app/.lambda && npm ci --omit=dev --ignore-scripts --no-audit --no-fund
