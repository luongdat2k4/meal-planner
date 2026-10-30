-- Catalog: nhóm món (chicken, beef, ...) và thiết bị / cách nấu (hob, oven, airfryer, ...).
CREATE TABLE category (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  slug       TEXT NOT NULL UNIQUE,
  emoji      TEXT,
  kind       TEXT NOT NULL DEFAULT 'meal' CHECK (kind IN ('meal', 'method')),
  sort_order INTEGER NOT NULL DEFAULT 0
);
