-- Static content schema for in-place admin editing

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS static_content (
  content_key TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('shared', 'page')),
  field_type TEXT NOT NULL CHECK (
    field_type IN (
      'text',
      'multiline_text',
      'string_list',
      'faq_items',
      'team_members',
      'structured_list'
    )
  ),
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_static_content_page_id
  ON static_content(page_id);

CREATE INDEX IF NOT EXISTS idx_static_content_scope
  ON static_content(scope);
