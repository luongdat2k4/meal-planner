-- Runtime: kế hoạch tuần. week_start là ngày thứ 2 (YYYY-MM-DD).
CREATE TABLE plan (
  week_start TEXT PRIMARY KEY CHECK (date(week_start) = week_start),
  servings   REAL NOT NULL DEFAULT 2,
  budget     REAL
);

CREATE TABLE plan_item (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  week_start TEXT NOT NULL REFERENCES plan(week_start) ON DELETE CASCADE,
  weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  position   INTEGER NOT NULL DEFAULT 0,
  meal_slug    TEXT NOT NULL REFERENCES meal(slug) ON UPDATE CASCADE,
  servings   REAL NOT NULL
);
CREATE INDEX idx_plan_item_week ON plan_item(week_start, weekday, position);
