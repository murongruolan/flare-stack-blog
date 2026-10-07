-- Streams (内容归属) become admin-CRUD-able data. Two built-in streams are
-- seeded; the news/policy slugs are the ones public pages consume.
CREATE TABLE category_streams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO category_streams (name, slug) VALUES ('新闻动态', 'news');
INSERT INTO category_streams (name, slug) VALUES ('政策法规', 'policy');

-- Replace the 0026 enum-ish column with a nullable FK to the stream slug;
-- NULL means 无归属 (posts in such categories surface on no public page).
ALTER TABLE categories ADD COLUMN stream_slug TEXT REFERENCES category_streams(slug) ON DELETE SET NULL;
UPDATE categories SET stream_slug = 'news' WHERE type = 'news';
UPDATE categories SET stream_slug = 'policy' WHERE type = 'policy';
ALTER TABLE categories DROP COLUMN type;
