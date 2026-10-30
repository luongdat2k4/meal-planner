import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const toolkitRoot = resolve(currentDir, "..");
const repoRoot = resolve(toolkitRoot, "..");
const databaseRoot = resolve(repoRoot, "database");
const appRoot = resolve(repoRoot, "App");

/** Mọi đường dẫn của toolkit. Không có file mô tả schema nào ngoài `db/schema/*.sql` và `db/layout.json`. */
export const config = {
  toolkitRoot,
  repoRoot,
  /** Thư mục chứa các file `*.sql` định nghĩa schema (chạy theo thứ tự tên file). */
  schemaDir: resolve(toolkitRoot, "db/schema"),
  /** Khai báo bảng nào thuộc file catalog nào, bảng nào là runtime. Có thể không tồn tại. */
  layoutPath: resolve(toolkitRoot, "db/layout.json"),
  databaseRoot,
  catalogDir: resolve(databaseRoot, "catalog"),
  masterPath: resolve(databaseRoot, "master.db"),
  manifestPath: resolve(databaseRoot, "manifest.json"),
  runtimeTemplatePath: resolve(databaseRoot, "runtime-template.db"),
  appRoot,
  /** Đích của Stage: App đóng gói thư mục này. */
  stageDir: resolve(appRoot, "public/db"),
  i18nDir: resolve(appRoot, "public/i18n"),
  sqlJsDistDir: resolve(toolkitRoot, "node_modules/sql.js/dist")
} as const;
