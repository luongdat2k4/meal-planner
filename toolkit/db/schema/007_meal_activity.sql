-- Runtime: lưu / chấm điểm / ghi chú / đã nấu / xem gần đây.
CREATE TABLE meal_activity (
  meal_id        TEXT PRIMARY KEY REFERENCES meal(id) ON DELETE CASCADE,
  is_saved       INTEGER NOT NULL DEFAULT 0 CHECK (is_saved IN (0, 1)),
  is_disliked    INTEGER NOT NULL DEFAULT 0 CHECK (is_disliked IN (0, 1)),
  rating         INTEGER CHECK (rating BETWEEN 1 AND 5),
  note           TEXT,
  last_cooked_at TEXT,
  last_viewed_at TEXT
);
