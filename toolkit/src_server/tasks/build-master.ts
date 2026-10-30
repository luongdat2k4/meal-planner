import Database from "better-sqlite3";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../config.js";
import { withFsRetry } from "../fs-retry.js";
import { readSchemaFiles } from "./schema-files.js";
import type { Log } from "./runner.js";

export interface BuildMasterOptions {
  outPath?: string;
  recreate?: boolean;
  log?: Log;
}

/**
 * `database/master.db` là nguồn sự thật duy nhất cho catalog. Schema đến từ các file
 * `db/schema/*.sql`, chạy theo thứ tự tên file. Không có file nào thì master.db là schema rỗng.
 *
 * - Build thường: chỉ chạy file chưa từng áp dụng (ghi trong bảng `_schema_files`), giữ nguyên dữ liệu.
 *   File đã áp dụng mà nội dung đổi thì dừng, vì SQL đã chạy không thể tự áp lại; dùng file mới (ALTER...)
 *   hoặc Build + Recreate.
 * - Recreate: xóa master.db rồi chạy lại toàn bộ.
 */
export function runBuildMaster({
  outPath = config.masterPath,
  recreate = false,
  log = console.log
}: BuildMasterOptions = {}): void {
  mkdirSync(dirname(outPath), { recursive: true });
  if (recreate && existsSync(outPath)) {
    withFsRetry(`xóa ${outPath}`, () => rmSync(outPath));
  }

  const files = readSchemaFiles();
  const db = new Database(outPath);
  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS _schema_files (
         name TEXT PRIMARY KEY,
         sha256 TEXT NOT NULL,
         applied_at TEXT NOT NULL
       )`
    );
    const applied = new Map(
      (db.prepare("SELECT name, sha256 FROM _schema_files").all() as { name: string; sha256: string }[]).map(
        (row) => [row.name, row.sha256]
      )
    );

    for (const file of files) {
      const previous = applied.get(file.name);
      if (previous !== undefined && previous !== file.sha256) {
        throw new Error(
          `[build-master] ${file.name} đã được áp dụng nhưng nội dung đã đổi. Thêm file schema mới (ALTER TABLE...) hoặc chạy Build + Recreate.`
        );
      }
    }

    const pending = files.filter((file) => !applied.has(file.name));
    const insertApplied = db.prepare("INSERT INTO _schema_files (name, sha256, applied_at) VALUES (?, ?, ?)");
    for (const file of pending) {
      db.transaction(() => {
        db.exec(file.sql);
        insertApplied.run(file.name, file.sha256, new Date().toISOString());
      })();
      log(`[build-master] áp dụng ${file.name}`);
    }

    const tableCount = (
      db
        .prepare(
          "SELECT count(*) AS c FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\'"
        )
        .get() as { c: number }
    ).c;
    log(
      `[build-master] ${recreate ? "recreated" : "built"} ${outPath}: ${files.length} file schema (${pending.length} mới), ${tableCount} bảng`
    );
    if (files.length === 0) {
      log("[build-master] db/schema chưa có file .sql nào: master.db là schema rỗng");
    }
  } finally {
    db.close();
  }
}
