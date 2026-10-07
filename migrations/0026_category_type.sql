-- Category stream type: 'news' posts surface on /posts, 'policy' on /policy.
-- Existing categories stay on the news stream.
ALTER TABLE categories
  ADD COLUMN type TEXT NOT NULL DEFAULT 'news';
