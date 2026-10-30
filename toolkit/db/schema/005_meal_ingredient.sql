-- Catalog: công thức (nhiều-nhiều meal <-> ingredient). amount tính cho meal.base_servings.
CREATE TABLE meal_ingredient (
  meal_slug       TEXT NOT NULL REFERENCES meal(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  ingredient_slug TEXT NOT NULL REFERENCES ingredient(slug) ON UPDATE CASCADE,
  amount        REAL NOT NULL,
  unit          TEXT NOT NULL,
  PRIMARY KEY (meal_slug, ingredient_slug)
);
CREATE INDEX idx_meal_ingredient_ingredient ON meal_ingredient(ingredient_slug);
