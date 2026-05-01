#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-jwd-admin-db}"
TARGET="${2:-local}" # local | remote

if [[ "${TARGET}" != "local" && "${TARGET}" != "remote" ]]; then
  echo "Usage: ./scripts/seed-static-content.sh [db-name] [local|remote]"
  exit 1
fi

echo "Generating seed SQL from current templates + registry..."
node "./scripts/seed-static-content.mjs"

echo "Applying static-content seed to ${DB_NAME} (${TARGET})..."
npx wrangler d1 execute "${DB_NAME}" "--${TARGET}" --file "./scripts/seed-static-content.sql"

echo "Static content seed complete."
