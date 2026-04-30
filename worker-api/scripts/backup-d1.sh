#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-jwd-admin-db}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="backups"
OUTPUT_FILE="${OUTPUT_DIR}/d1-${DB_NAME}-${TIMESTAMP}.sql"

mkdir -p "${OUTPUT_DIR}"
echo "Exporting D1 database '${DB_NAME}' to ${OUTPUT_FILE}"
npx wrangler d1 export "${DB_NAME}" --remote --output "${OUTPUT_FILE}"
echo "Backup complete: ${OUTPUT_FILE}"
