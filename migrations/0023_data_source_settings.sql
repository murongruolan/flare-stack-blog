CREATE TABLE IF NOT EXISTS data_source_settings (
  id integer PRIMARY KEY NOT NULL DEFAULT 1,
  engine_model_key text NOT NULL DEFAULT '',
  engine_data_key text NOT NULL DEFAULT '',
  updated_at integer NOT NULL DEFAULT (unixepoch()),
  CONSTRAINT data_source_settings_singleton CHECK (id = 1)
);
