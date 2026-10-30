# Meal Planner Toolkit

Web dev chỉnh sửa dữ liệu và CLI build/split/stage DB cho Meal Planner. Schema đến từ các file SQL, theo `design-note/database-design.md`.

| Đường dẫn | Vai trò |
|---|---|
| `db/schema/*.sql` | Nguồn schema, chạy theo thứ tự tên file. Trống thì master.db là schema rỗng |
| `db/layout.json` | Chia bảng vào các file catalog, đánh dấu bảng `runtime`, loại file khỏi App (`appExcluded`) |
| `../database/master.db` | Nguồn sự thật cho catalog, sửa qua giao diện |
| `../database/catalog/*.db`, `runtime-template.db`, `manifest.json` | Output của Split |
| `../App/public/db` | Đích của Stage. App đóng gói thư mục này |
| `../App/public/i18n/<locale>.json` | Stage xuất một file JSON cho mỗi cột ngôn ngữ trong bảng `language` (trừ `id`, `key`), dạng object theo slug: `{ "steak": { "title": "Steak", "step": { "oven": { "3": "..." } } } }`. Khóa chỉ có slug thành `title`, khóa bước nấu `<slug>.step.<method>.<n>` lồng bên trong |

## Chạy

```powershell
npm install
npm run dev          # giao diện + API tại http://localhost:5175
```

CLI (cùng logic với các nút trên giao diện):

```powershell
npm run db:build              # áp dụng file .sql mới vào master.db
npm run db:build:recreate     # xóa master.db rồi dựng lại (mất dữ liệu)
npm run db:split              # master.db -> database/catalog/*.db + runtime-template.db + manifest.json
npm run db:verify-split
npm run db:validate-sqljs
npm run db:stage              # Split rồi copy sang App/public/db (+ i18n)
```

Stage sẽ dừng trước khi ghi vào App nếu bảng `language` trong `master.db` đang rỗng, để tránh thay catalog đang dùng bằng bản rỗng.

## Hai loại bảng

- **catalog**: dữ liệu có sẵn do bạn cung cấp (món, nguyên liệu, danh mục, công thức, chuỗi dịch...). Sửa qua Toolkit, đóng gói vào App, App chỉ đọc. Split copy cả dòng vào `database/catalog/*.db`.
- **runtime**: dữ liệu phát sinh khi người dùng dùng app (sở thích, hoạt động với món, kế hoạch tuần, danh sách đi chợ). Liệt kê trong `db/layout.json` > `runtime`. Split chỉ lấy khung bảng rỗng vào `runtime-template.db`; App dùng nó để tạo DB người dùng.
- Bảng không liệt kê trong `runtime` mặc định là catalog.

## Quy tắc

- File `.sql` đã Build thì không sửa nữa: thêm file mới (`ALTER TABLE ...`) hoặc Build + Recreate.
- Bảng tên bắt đầu bằng `_` là nội bộ của toolkit (ẩn, không split).
- `catalogVersion` trong manifest dạng `YYYY-MM-DD.n`, tăng mỗi lần Split.
- Ràng buộc dữ liệu (NOT NULL, UNIQUE, CHECK, FOREIGN KEY, ON DELETE) do SQLite thực thi; toolkit bật `foreign_keys`.
