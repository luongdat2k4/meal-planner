-- Catalog: món ăn. dietary / allergens / methods là mảng slug lưu dạng JSON text;
-- steps là object {"hob": [1, 2, 3], "oven": [1, 2]} (số bước, UI ghép '<slug>.step.<method>.<n>').
CREATE TABLE meal (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  slug          TEXT NOT NULL UNIQUE,
  category_slug   TEXT REFERENCES category(slug) ON UPDATE CASCADE,
  image         TEXT,
  base_servings INTEGER NOT NULL DEFAULT 2,
  prep_minutes  INTEGER NOT NULL,
  cook_minutes  INTEGER NOT NULL,
  price_serving REAL,
  calories      INTEGER,
  protein_g     INTEGER,
  carbs_g       INTEGER,
  fat_g         INTEGER,
  dietary       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(dietary) AND json_type(dietary) = 'array'),
  allergens     TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allergens) AND json_type(allergens) = 'array'),
  methods       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(methods) AND json_type(methods) = 'array'),
  steps         TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(steps) AND json_type(steps) = 'object')
);
CREATE INDEX idx_meal_category ON meal(category_slug);
