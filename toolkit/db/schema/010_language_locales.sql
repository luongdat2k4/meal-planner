-- Thêm 18 ngôn ngữ còn lại của bộ cờ trong App/public/asset/flag (en, vn đã có ở 001). Tên cột = tên file cờ (ar.svg → ar),
-- riêng tiếng Việt giữ cột `vn`. Cho phép NULL: ô chưa dịch thì app lùi về `en`.
ALTER TABLE language ADD COLUMN ar TEXT;
ALTER TABLE language ADD COLUMN bn TEXT;
ALTER TABLE language ADD COLUMN de TEXT;
ALTER TABLE language ADD COLUMN es TEXT;
ALTER TABLE language ADD COLUMN fr TEXT;
ALTER TABLE language ADD COLUMN hi TEXT;
ALTER TABLE language ADD COLUMN id_ TEXT;
ALTER TABLE language ADD COLUMN it TEXT;
ALTER TABLE language ADD COLUMN ja TEXT;
ALTER TABLE language ADD COLUMN ko TEXT;
ALTER TABLE language ADD COLUMN nl TEXT;
ALTER TABLE language ADD COLUMN pl TEXT;
ALTER TABLE language ADD COLUMN pt TEXT;
ALTER TABLE language ADD COLUMN ru TEXT;
ALTER TABLE language ADD COLUMN th TEXT;
ALTER TABLE language ADD COLUMN tr TEXT;
ALTER TABLE language ADD COLUMN ur TEXT;
ALTER TABLE language ADD COLUMN zh TEXT;
