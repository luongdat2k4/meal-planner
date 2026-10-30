-- Runtime: đúng 1 dòng. Mảng lưu dạng JSON text (slug / số).
CREATE TABLE preference (
  id                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  household_size    INTEGER NOT NULL DEFAULT 2,
  dietary_ids       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(dietary_ids) AND json_type(dietary_ids) = 'array'),
  allergen_ids      TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allergen_ids) AND json_type(allergen_ids) = 'array'),
  protein_likes     TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(protein_likes) AND json_type(protein_likes) = 'array'),
  disliked_meal_slugs TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(disliked_meal_slugs) AND json_type(disliked_meal_slugs) = 'array'),
  cooking_days      TEXT NOT NULL DEFAULT '[1,2,3,4,5]' CHECK (json_valid(cooking_days) AND json_type(cooking_days) = 'array'),
  max_cook_minutes  INTEGER,
  weekly_budget     REAL,
  weekly_reminder   INTEGER NOT NULL DEFAULT 0 CHECK (weekly_reminder IN (0, 1))
);
