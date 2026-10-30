-- Catalog: nguyên liệu. is_pantry = gia vị / dầu, không đưa vào danh sách đi chợ.
CREATE TABLE ingredient (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  slug      TEXT NOT NULL UNIQUE,
  image     TEXT,
  section   TEXT,
  is_pantry INTEGER NOT NULL DEFAULT 0 CHECK (is_pantry IN (0, 1))
);
