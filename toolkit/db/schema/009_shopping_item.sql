-- Runtime: danh sách đi chợ. ingredient_slug null = nhập tay. store_id là id trong stores.json (không có bảng store).
-- Dòng sinh từ plan để label trống, tên đọc qua language.key = ingredient.slug.
-- Quy tắc sinh: quantity = meal_ingredient.amount * (plan_item.servings / meal.base_servings), bỏ ingredient.is_pantry = 1,
-- upsert theo (week_start, ingredient_slug, unit).
CREATE TABLE shopping_item (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  week_start    TEXT,
  ingredient_slug TEXT REFERENCES ingredient(slug) ON UPDATE CASCADE,
  label         TEXT NOT NULL,
  quantity      REAL,
  unit          TEXT,
  checked       INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
  store_id      TEXT
);
CREATE INDEX idx_shopping_item_week ON shopping_item(week_start);
CREATE UNIQUE INDEX uq_shopping_item_plan ON shopping_item(week_start, ingredient_slug, unit) WHERE ingredient_slug IS NOT NULL;
