# D1 Setup Guide (Step by Step)

This guide walks you through D1 from zero to working with this project.

## 1) Create the D1 database

From `worker-api/`:

```bash
npx wrangler d1 create jwd-admin-db
```

Copy the returned `database_id`.

## 2) Add the D1 binding in `wrangler.jsonc`

In `worker-api/wrangler.jsonc`, set:
- `d1_databases[0].database_name` -> `jwd-admin-db`
- `d1_databases[0].database_id` -> your copied ID

## 3) Apply schema migrations

Local:

```bash
npx wrangler d1 migrations apply jwd-admin-db --local
```

Remote (Cloudflare):

```bash
npx wrangler d1 migrations apply jwd-admin-db --remote
```

## 4) Quick sanity check

Run:

```bash
npx wrangler d1 execute jwd-admin-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

You should see:
- `case_studies`
- `categories`
- `case_study_categories`
- `timeline_steps`
- `case_study_images`

## 5) Add sample category + case study (optional)

```bash
npx wrangler d1 execute jwd-admin-db --remote --command "INSERT INTO categories (id,name,slug,sort_order) VALUES ('cat_saas','SaaS','saas',1);"
npx wrangler d1 execute jwd-admin-db --remote --command \"INSERT INTO case_studies (id,slug,title,short_description,tags_json,accent_color,background_color,sort_order,is_active) VALUES ('cs_flowboard','flowboard','FlowBoard','A real-time collaborative workspace.','[\\\"realtime\\\",\\\"saas\\\"]','#00d4a8','#0a2218',1,1);\"
npx wrangler d1 execute jwd-admin-db --remote --command "INSERT INTO case_study_categories (case_study_id,category_id) VALUES ('cs_flowboard','cat_saas');"
```

## 6) Verify API reads from D1

With worker running:

```bash
curl -s https://jwd-admin-api.terry-williams-god.workers.dev/public/case-studies
```

If seeded, response should include your case study.
