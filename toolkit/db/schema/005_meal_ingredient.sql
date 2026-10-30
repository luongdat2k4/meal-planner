-- Catalog: công thức (nhiều-nhiều meal <-> ingredient). amount tính cho meal.base_servings.
CREATE TABLE meal_ingredient (
  meal_id       TEXT NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredient(id),
  amount        REAL NOT NULL,
  unit          TEXT NOT NULL,
  PRIMARY KEY (meal_id, ingredient_id)
);
CREATE INDEX idx_meal_ingredient_ingredient ON meal_ingredient(ingredient_id);
