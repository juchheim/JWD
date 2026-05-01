#!/usr/bin/env bash
set -euo pipefail

DB_NAME="jwd-admin-db"
TARGET="local" # local | remote

if [[ $# -ge 1 ]]; then
  if [[ "$1" == "local" || "$1" == "remote" ]]; then
    TARGET="$1"
  else
    DB_NAME="$1"
  fi
fi

if [[ $# -ge 2 ]]; then
  TARGET="$2"
fi

if [[ "${TARGET}" != "local" && "${TARGET}" != "remote" ]]; then
  echo "Usage: ./scripts/seed-static-content.sh [db-name] [local|remote]"
  exit 1
fi

echo "Generating seed SQL from current templates + registry..."
node "./scripts/seed-static-content.mjs"

echo "Applying static-content seed to ${DB_NAME} (${TARGET})..."
if [[ "${TARGET}" == "remote" ]]; then
  npx wrangler d1 execute "${DB_NAME}" --remote --file "./scripts/seed-static-content.sql"
else
  npx wrangler d1 execute "${DB_NAME}" --local --file "./scripts/seed-static-content.sql"
fi

echo "Static content seed complete."
