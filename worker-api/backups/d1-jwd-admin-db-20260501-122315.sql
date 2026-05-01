PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_init.sql','2026-04-30 18:42:39');
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "categories" ("id","name","slug","sort_order","created_at","updated_at") VALUES('cat_saas','SaaS','saas',1,'2026-04-30 18:46:06','2026-04-30 18:46:06');
INSERT INTO "categories" ("id","name","slug","sort_order","created_at","updated_at") VALUES('872f6fc3-f28e-4d9c-a35a-02c30752b7f2','Test','test',0,'2026-04-30T20:06:14.374Z','2026-04-30T20:06:14.374Z');
INSERT INTO "categories" ("id","name","slug","sort_order","created_at","updated_at") VALUES('9a6a2ab0-9e04-4bf2-b264-224cfb318cf9','CMS','cms',0,'2026-05-01T15:32:53.816Z','2026-05-01T15:32:53.816Z');
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
INSERT INTO "case_studies" ("id","slug","title","short_description","tags_json","accent_color","background_color","sort_order","is_active","created_at","updated_at") VALUES('868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','dtas','DTAS: Digital Tracking & Accountability System','This is a short description of the test case study.','["SaaS","Data Tracking","Data Analysis","AI","COPPA-compliance","FERPA compliance"]','#c4bc00','#001e57',0,1,'2026-04-30T20:20:36.498Z','2026-05-01T16:33:51.773Z');
INSERT INTO "case_studies" ("id","slug","title","short_description","tags_json","accent_color","background_color","sort_order","is_active","created_at","updated_at") VALUES('a403808b-8a37-4eef-8aaf-b54222c42c2a','case-study-number-two','Case Study Number Two','This is case study number two. A non-existent test case study on nothing.','["SaaS","Database","Website","Mobile-first"]','#d29d00','#0a2218',1,1,'2026-05-01T15:27:08.646Z','2026-05-01T15:27:57.887Z');
INSERT INTO "case_studies" ("id","slug","title","short_description","tags_json","accent_color","background_color","sort_order","is_active","created_at","updated_at") VALUES('e68ef864-c76a-4421-8682-93d517c46eb3','test-case-study-three','Test Case Study Three','Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris.','["CMS","WordPress","Analytics","SEO"]','#3a88fe','#001e57',2,1,'2026-05-01T15:33:16.446Z','2026-05-01T15:40:03.617Z');
CREATE TABLE case_study_categories (
  case_study_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (case_study_id, category_id),
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
INSERT INTO "case_study_categories" ("case_study_id","category_id","created_at") VALUES('a403808b-8a37-4eef-8aaf-b54222c42c2a','cat_saas','2026-05-01T15:27:57.887Z');
INSERT INTO "case_study_categories" ("case_study_id","category_id","created_at") VALUES('e68ef864-c76a-4421-8682-93d517c46eb3','9a6a2ab0-9e04-4bf2-b264-224cfb318cf9','2026-05-01T15:40:03.617Z');
INSERT INTO "case_study_categories" ("case_study_id","category_id","created_at") VALUES('868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','cat_saas','2026-05-01T16:33:51.773Z');
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
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('49c08960-1dc9-4928-bf82-9efb74cd2d9f','a403808b-8a37-4eef-8aaf-b54222c42c2a','Discovery',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',1,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('0af3ab34-c861-45db-95e8-b785320a5006','a403808b-8a37-4eef-8aaf-b54222c42c2a','Planning',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet. Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',2,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('0a9b687d-7f05-4b84-985d-4a89f9a2642a','a403808b-8a37-4eef-8aaf-b54222c42c2a','Implementation',4,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet. Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',3,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('54e38e76-e6fc-4369-8be4-5dc4ad161107','a403808b-8a37-4eef-8aaf-b54222c42c2a','Review',2,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',4,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('90bd8861-2f72-4db7-b4a0-05b96dc3795c','a403808b-8a37-4eef-8aaf-b54222c42c2a','Deploy',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',5,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('c6a46b2f-32bb-40b1-be66-2c7a0b164dc0','e68ef864-c76a-4421-8682-93d517c46eb3','Discovery',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',1,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('04bf5c44-a17d-437e-bf7e-0bcf726dccad','e68ef864-c76a-4421-8682-93d517c46eb3','Research',2,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet. Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',2,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('a30df46f-43dc-4c78-937b-8764e1534a42','e68ef864-c76a-4421-8682-93d517c46eb3','Planning',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',3,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('7e537989-c595-4113-a395-b94cc7b62150','e68ef864-c76a-4421-8682-93d517c46eb3','Implementation',5,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet. Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',4,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('146f5568-a69a-48e8-8f2f-db55a0d0b4cf','e68ef864-c76a-4421-8682-93d517c46eb3','Review',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',5,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('5f062a6b-4a4b-4cc6-9a92-9fafa2814652','e68ef864-c76a-4421-8682-93d517c46eb3','Implementation',1,'Etiam lobortis velit nec tellus porta scelerisque. Etiam nec ultrices lorem, a laoreet mauris. Maecenas dapibus velit eros, sit amet bibendum nisi iaculis sit amet.',6,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('bdf40ba6-1863-4fbd-9675-a04886231fb1','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','Discovery',2,'This is the summary for step 1. This is the summary for step 1. This is the summary for step 1. This is the summary for step 1. This is the summary for step 1. This is the summary for step 1. This is the summary for step 1.',1,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('18a023e4-86de-4735-ad6c-61eb7a57ea7e','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','Implementation',5,'This is the summary for step 2. This is the summary for step 2. This is the summary for step 2. This is the summary for step 2. This is the summary for step 2. This is the summary for step 2.',2,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "timeline_steps" ("id","case_study_id","name","duration_weeks","summary","sort_order","created_at","updated_at") VALUES('e8e5e57b-fa70-4c0f-96cf-efea97241eed','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','Delivery',1,'This is the summary for step 3. This is the summary for step 3. This is the summary for step 3. This is the summary for step 3. This is the summary for step 3.',3,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
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
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('b0cea23b-d205-47bc-a069-920d5f9aad2f','a403808b-8a37-4eef-8aaf-b54222c42c2a','case-studies/case-study-number-two/80f0858d-aeac-4523-84df-92443896226c-TEST.jpg','TEST.jpg',2,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('2a2a51ed-3ef6-44c5-aa8c-5baf9fecdbaf','a403808b-8a37-4eef-8aaf-b54222c42c2a','case-studies/case-study-number-two/5cf2b53b-bd97-47fd-84f0-aa07c9b3d059-test2.jpg','test2.jpg',3,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('f0b3b024-126d-49b8-a82c-7ff7bf5b26c0','a403808b-8a37-4eef-8aaf-b54222c42c2a','case-studies/case-study-number-two/110b48ed-385a-41ff-921b-f790de30227e-test3.jpg','test3.jpg',4,'2026-05-01T15:27:57.887Z','2026-05-01T15:27:57.887Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('a2ee73fb-af9a-472e-9e86-b20513037f5b','e68ef864-c76a-4421-8682-93d517c46eb3','case-studies/unassigned/46b23f72-c59d-4bf2-aa55-bb52d7f52e60-TEST.jpg','TEST.jpg',2,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('a9cf7bf6-a7a1-4607-8fee-e1ccf415236c','e68ef864-c76a-4421-8682-93d517c46eb3','case-studies/unassigned/aa79ac97-ae1c-41af-981c-8ac0d465e0cb-test2.jpg','test2.jpg',3,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('f9759a5d-ff76-4dc9-84d2-6dedd462de4a','e68ef864-c76a-4421-8682-93d517c46eb3','case-studies/unassigned/779c6c89-e6ca-4cf6-b000-64a1a8648453-test3.jpg','test3.jpg',4,'2026-05-01T15:40:03.617Z','2026-05-01T15:40:03.617Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('6acb6cd5-03e8-4045-ae46-d36ffb171f2a','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','case-studies/dtas/e5443cd7-d940-41fc-92db-f4749ac2872a-dtas2.jpg','dtas2.jpg',1,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('7b577ba2-2d96-4d82-9b24-1b41f06a3593','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','case-studies/dtas/bec22206-43c2-4cb5-a085-4068f0f5a245-dtas1.jpg','dtas1.jpg',2,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('1b4ef539-52b3-4d6a-80c1-d50bf764d404','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','case-studies/dtas/81d98392-48cf-483e-8b40-782d0fc2391a-dtas3.jpg','dtas3.jpg',3,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('4a8389f3-9b4c-4e2d-b0eb-39526e6d9b85','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','case-studies/dtas/547044a4-dd40-491e-8121-142a651a679e-dtas5.jpg','dtas5.jpg',4,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
INSERT INTO "case_study_images" ("id","case_study_id","r2_key","alt","sort_order","created_at","updated_at") VALUES('b1ffffdf-c9d8-4878-afa0-c142eac83d3d','868d3e4b-0c3b-4aa4-97e2-7a5d9e0e0857','case-studies/dtas/edc4223e-ca0a-4b97-af7a-995a456327f1-dtas4.jpg','dtas4.jpg',5,'2026-05-01T16:33:51.773Z','2026-05-01T16:33:51.773Z');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
CREATE INDEX idx_case_studies_active_sort
  ON case_studies(is_active, sort_order);
CREATE INDEX idx_timeline_steps_case_study
  ON timeline_steps(case_study_id, sort_order);
CREATE INDEX idx_case_study_images_case_study
  ON case_study_images(case_study_id, sort_order);
CREATE INDEX idx_case_study_categories_case_study
  ON case_study_categories(case_study_id);
