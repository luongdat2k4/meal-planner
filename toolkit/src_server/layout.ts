import { existsSync, readFileSync } from "node:fs";
import { config } from "./config.js";

/**
 * `db/layout.json` quyết định cách Split chia master.db. Mọi trường đều tùy chọn:
 * - `catalogDefaultFile`: file catalog mặc định cho bảng không nằm trong `groups` (mặc định `catalog/catalog.db`).
 * - `groups`: `{ "catalog/exercise.db": ["exercise", "muscle"] }`.
 * Mọi bảng không liệt kê trong `runtime` đều là catalog.
 * - `runtime`: bảng dữ liệu người dùng. Split chỉ tạo bảng rỗng trong `runtime-template.db`, không copy dòng.
 * - `appExcluded`: tên file catalog không đưa vào App khi Stage (ví dụ `language.db`).
 * Bảng có tên bắt đầu bằng `_` là bảng nội bộ của toolkit, không bao giờ được split.
 */
export interface Layout {
  catalogDefaultFile: string;
  groups: Record<string, string[]>;
  runtime: string[];
  appExcluded: string[];
}

/** catalog: dữ liệu có sẵn do người làm nội dung cung cấp, App chỉ đọc. runtime: dữ liệu phát sinh khi người dùng dùng app. */
export type TableKind = "catalog" | "runtime";

export function loadLayout(): Layout {
  const raw = existsSync(config.layoutPath)
    ? (JSON.parse(readFileSync(config.layoutPath, "utf8")) as Partial<Layout>)
    : {};
  return {
    catalogDefaultFile: raw.catalogDefaultFile ?? "catalog/catalog.db",
    groups: raw.groups ?? {},
    runtime: raw.runtime ?? [],
    appExcluded: raw.appExcluded ?? []
  };
}

export function isInternalTable(name: string): boolean {
  return name.startsWith("_") || name.startsWith("sqlite_");
}

export function tableKind(layout: Layout, table: string): TableKind {
  return layout.runtime.includes(table) ? "runtime" : "catalog";
}

/** File catalog chứa `table`, hoặc null nếu là bảng runtime. */
export function catalogFileOf(layout: Layout, table: string): string | null {
  if (layout.runtime.includes(table)) {
    return null;
  }
  for (const [file, tables] of Object.entries(layout.groups)) {
    if (tables.includes(table)) {
      return file;
    }
  }
  return layout.catalogDefaultFile;
}
