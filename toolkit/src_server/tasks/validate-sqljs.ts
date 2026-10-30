import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { join } from "node:path";
import initSqlJs, { type Database as SqlJsDatabase, type SqlValue } from "sql.js";
import { config } from "../config.js";
import { isInternalTable } from "../layout.js";
import { readSchemaFiles } from "./schema-files.js";
import type { Log } from "./runner.js";

function sqlJsAll(db: SqlJsDatabase, sql: string): Record<string, SqlValue>[] {
  const statement = db.prepare(sql);
  try {
    const rows: Record<string, SqlValue>[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

function tableNamesSqlJs(db: SqlJsDatabase): string[] {
  return sqlJsAll(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map((row) => String(row.name))
    .filter((name) => !isInternalTable(name));
}

function tableInfoSqlJs(db: SqlJsDatabase, table: string): { name: string; type: string }[] {
  return sqlJsAll(db, `PRAGMA table_info(${JSON.stringify(table)})`).map((row) => ({
    name: String(row.name),
    type: String(row.type ?? "").toUpperCase()
  }));
}

function tableInfoBetterSqlite(db: Database.Database, table: string): { name: string; type: string }[] {
  const rows = db.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all() as {
    name: string;
    type: string | null;
  }[];
  return rows.map((row) => ({ name: row.name, type: String(row.type ?? "").toUpperCase() }));
}

export interface ValidateSqlJsOptions {
  log?: Log;
}

/**
 * Chạy lại toàn bộ `db/schema/*.sql` trong WASM `sql.js` (engine đọc db của App) rồi so khớp với
 * master.db thật. Bắt các câu SQL mà better-sqlite3 chấp nhận nhưng sql.js không, và bắt master.db
 * bị sửa tay lệch khỏi các file schema.
 */
export async function runValidateSqlJs({
  log = console.log
}: ValidateSqlJsOptions = {}): Promise<{ tableCount: number }> {
  if (!existsSync(config.masterPath)) {
    throw new Error(`[validate-sqljs] missing master db at ${config.masterPath}; chạy task Build trước`);
  }

  const SQL = await initSqlJs({
    locateFile: (file) => join(config.sqlJsDistDir, file)
  });

  const files = readSchemaFiles();
  const sqlJsDb = new SQL.Database();
  let tableCount = 0;

  try {
    for (const file of files) {
      try {
        sqlJsDb.exec(file.sql);
      } catch (error) {
        throw new Error(`${file.name}: sql.js không chạy được: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const sqlJsTables = tableNamesSqlJs(sqlJsDb);
    tableCount = sqlJsTables.length;

    const masterDb = new Database(config.masterPath, { readonly: true });
    try {
      const masterTables = (
        masterDb
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all() as { name: string }[]
      )
        .map((row) => row.name)
        .filter((name) => !isInternalTable(name));

      if (JSON.stringify(masterTables) !== JSON.stringify(sqlJsTables)) {
        throw new Error(
          `table mismatch: master=${masterTables.join(", ")} schema=${sqlJsTables.join(", ")}. Chạy Build + Recreate nếu master.db đã bị lệch.`
        );
      }

      for (const table of masterTables) {
        const masterInfo = tableInfoBetterSqlite(masterDb, table);
        const sqlJsInfo = tableInfoSqlJs(sqlJsDb, table);
        if (JSON.stringify(masterInfo) !== JSON.stringify(sqlJsInfo)) {
          throw new Error(
            `schema mismatch for ${table}: master=${JSON.stringify(masterInfo)} schema=${JSON.stringify(sqlJsInfo)}`
          );
        }
      }
    } finally {
      masterDb.close();
    }
  } finally {
    sqlJsDb.close();
  }

  log(`[validate-sqljs] schema ok (${files.length} file .sql, ${tableCount} bảng)`);
  return { tableCount };
}
