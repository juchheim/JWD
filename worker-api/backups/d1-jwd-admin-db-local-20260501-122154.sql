PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_init.sql','2026-04-30 18:42:35');
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "categories" VALUES('cat_saas','SaaS','saas',1,'2026-04-30 18:52:36','2026-04-30 18:52:36');
CREATE TABLE case_studies (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  tags_json TEXT,
  accent_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "case_studies" VALUES('6f662baf-a9b5-44c7-95a2-15761051c49e','nexa-portal','Nexa Portal','A B2B client portal for onboarding and reporting.','["portal","b2b"]','#3b82f6','#0b1220',2,1,'2026-04-30T18:52:43.978Z','2026-04-30T18:52:43.978Z');
CREATE TABLE case_study_categories (
  case_study_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (case_study_id, category_id),
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
INSERT INTO "case_study_categories" VALUES('6f662baf-a9b5-44c7-95a2-15761051c49e','cat_saas','2026-04-30T18:52:43.978Z');
CREATE TABLE timeline_steps (
  id TEXT PRIMARY KEY,
  case_study_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks >= 1),
  summary TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE
);
INSERT INTO "timeline_steps" VALUES('252e1b91-fd82-4f8b-b417-ec88dab572e7','6f662baf-a9b5-44c7-95a2-15761051c49e','Discovery',2,'Gathered stakeholder requirements.',1,'2026-04-30T18:52:43.978Z','2026-04-30T18:52:43.978Z');
INSERT INTO "timeline_steps" VALUES('14865bdb-7f6f-4acc-b3db-a3edab08d057','6f662baf-a9b5-44c7-95a2-15761051c49e','Build',6,'Implemented core flows and dashboards.',2,'2026-04-30T18:52:43.978Z','2026-04-30T18:52:43.978Z');
CREATE TABLE case_study_images (
  id TEXT PRIMARY KEY,
  case_study_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE
);
INSERT INTO "case_study_images" VALUES('559ed3ae-c24d-4e9d-a85f-f0116ff18528','6f662baf-a9b5-44c7-95a2-15761051c49e','case-studies/test/remote-smoke.txt','Nexa hero',1,'2026-04-30T18:52:43.978Z','2026-04-30T18:52:43.978Z');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',1);
CREATE INDEX idx_case_studies_active_sort
  ON case_studies(is_active, sort_order);
CREATE INDEX idx_timeline_steps_case_study
  ON timeline_steps(case_study_id, sort_order);
CREATE INDEX idx_case_study_images_case_study
  ON case_study_images(case_study_id, sort_order);
CREATE INDEX idx_case_study_categories_case_study
  ON case_study_categories(case_study_id);