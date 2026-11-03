# Schema

Nguồn: `design-note/database-design.md`. Các file `*.sql` chạy theo thứ tự tên file.

| File | Bảng | Loại |
|---|---|---|
| 001 | `language` | catalog |
| 002 | `category` | catalog |
| 003 | `ingredient` | catalog |
| 004 | `meal` | catalog |
| 005 | `meal_ingredient` | catalog |
| 006 | `preference` | runtime |
| 007 | `meal_activity` | runtime |
| 008 | `plan`, `plan_item` | runtime |
| 009 | `shopping_item` | runtime |
| 010 | `language` (thêm 18 cột ngôn ngữ) | catalog |

- Cột ngôn ngữ của `language` đặt theo tên file cờ trong `App/public/asset/flag` (`ar bn de es fr hi it ja ko nl pl pt ru th tr ur zh`), riêng tiếng Việt là `vn` (cờ `vi.svg`) và tiếng Indonesia là `id_` (vì `id` là khoá chính). Ô chưa dịch để `NULL`.
- Bảng runtime được khai trong `../layout.json`.
- File đã Build thì không sửa nữa: thêm file mới (`ALTER TABLE ...`) hoặc Build + Recreate (mất dữ liệu).
- Kiểu SQLite thay cho Postgres: `uuid` → `TEXT` sinh bằng biểu thức v4, `text[]`/`jsonb` → `TEXT` có `CHECK (json_valid ...)`, `boolean` → `INTEGER 0/1`, `timestamptz` → `TEXT` ISO 8601.
- View `missing_translation` trong design note **không** đưa vào schema vì Split chia bảng sang nhiều file `.db`, view tham chiếu chéo sẽ hỏng. Chạy truy vấn đó trên `master.db` khi cần kiểm tra.
