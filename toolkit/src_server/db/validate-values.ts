/**
 * Giá trị một ô từ API có thể là object hoặc mảng (ví dụ import JSON mà cột `data` là object).
 * `better-sqlite3` coi object thường là bộ tham số có tên, nên bind thẳng sẽ lỗi "Too few parameter
 * values were provided"; còn `String(object)` thì ra "[object Object]". Vì vậy chuyển thành chuỗi JSON
 * trước khi ghi. Buffer và các kiểu nhị phân giữ nguyên.
 *
 * Ràng buộc dữ liệu (NOT NULL, UNIQUE, CHECK, FOREIGN KEY) do chính schema SQL thực thi; lỗi của SQLite
 * được `mapSqliteError` đổi thành phản hồi 400/409.
 */
export function toCellInput(value: unknown): unknown {
  return typeof value === "object" && value !== null && !ArrayBuffer.isView(value) ? JSON.stringify(value) : value;
}

export function toCellInputs(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, toCellInput(value)]));
}
