-- Catalog: bảng duy nhất chứa chữ hiển thị. Mọi bảng catalog khác không có cột title/name/label.
-- `id` là uuid ngẫu nhiên; `key` (unique) là danh tính nghiệp vụ và chính là slug của món / nguyên liệu / danh mục (xem design-note/database-design.md).
-- Bước nấu: '<slug>.step.<method>.<n>', ví dụ 'steak.step.oven.3'.
CREATE TABLE language (
  id  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))),
  key TEXT NOT NULL UNIQUE,
  en  TEXT,
  vn  TEXT
);
