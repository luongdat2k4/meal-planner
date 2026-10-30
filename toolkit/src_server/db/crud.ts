import type Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";
import { config } from "../config.js";
import { isInternalTable, loadLayout, tableKind, type TableKind } from "../layout.js";
import { openDb } from "./connection.js";
import { serializeRow } from "./serialize.js";
import { toCellInputs } from "./validate-values.js";
import { ApiError, mapSqliteError } from "../errors.js";

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface TableIndex {
  name: string;
  unique: number;
  origin: string;
  partial: number;
  sql: string | null;
}

export interface TableForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export interface TableSchema {
  table: string;
  kind: TableKind;
  sql: string | null;
  columns: TableColumn[];
  indexes: TableIndex[];
  fks: TableForeignKey[];
}

export interface MasterMeta {
  fileExists: boolean;
  path: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
  tableCount: number | null;
}

export interface RowsResult {
  rows: Record<string, unknown>[];
  total: number;
}

const TABLE_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function assertTableName(table: string): void {
  if (!TABLE_NAME_RE.test(table) || isInternalTable(table)) {
    throw new ApiError(400, `invalid table name: ${table}`);
  }
}

export function tableExists(db: Database.Database, table: string): boolean {
  return (
    db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) !== undefined
  );
}

export function requireMasterFile(): void {
  if (!existsSync(config.masterPath)) {
    throw new ApiError(404, `master.db chưa tồn tại (${config.masterPath}) — chạy task Build trước`);
  }
}

export function getMasterMeta(): MasterMeta {
  const fileExists = existsSync(config.masterPath);
  if (!fileExists) {
    return {
      fileExists,
      path: config.masterPath,
      sizeBytes: null,
      modifiedAt: null,
      tableCount: null
    };
  }

  const stat = statSync(config.masterPath);
  const db = openDb({ readonly: true });
  try {
    const tableCount = (
      db
        .prepare(
          "SELECT count(*) AS c FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\'"
        )
        .get() as { c: number }
    ).c;

    return {
      fileExists,
      path: config.masterPath,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      tableCount
    };
  } finally {
    db.close();
  }
}

export function getSchema(): TableSchema[] {
  requireMasterFile();
  const db = openDb({ readonly: true });
  try {
    const tables = db
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string; sql: string | null }[];

    const layout = loadLayout();
    return tables.filter((row) => !isInternalTable(row.name)).map((row) => {
      const table = row.name;
      const columns = db
        .prepare(`PRAGMA table_info(${quoteIdentifier(table)})`)
        .all() as TableColumn[];
      const indexes = db
        .prepare(`PRAGMA index_list(${quoteIdentifier(table)})`)
        .all() as unknown as { name: string; unique: number; origin: string; partial: number }[];
      const indexSql = new Map(
        (
          db
            .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ?")
            .all(table) as { name: string; sql: string | null }[]
        ).map((item) => [item.name, item.sql])
      );
      const fks = db
        .prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)})`)
        .all() as TableForeignKey[];

      return {
        table,
        kind: tableKind(layout, table),
        sql: row.sql,
        columns,
        indexes: indexes.map((index) => ({ ...index, sql: indexSql.get(index.name) ?? null })),
        fks
      } satisfies TableSchema;
    });
  } finally {
    db.close();
  }
}

export function getRows(table: string, page: number, pageSize: number): RowsResult {
  assertTableName(table);
  requireMasterFile();
  const db = openDb({ readonly: true });
  try {
    if (!tableExists(db, table)) {
      throw new ApiError(404, `unknown table: ${table}`);
    }
    const total = (
      db.prepare(`SELECT count(*) AS c FROM ${quoteIdentifier(table)}`).get() as { c: number }
    ).c;
    const rawRows = db
      .prepare(
        `SELECT rowid AS __rowid, * FROM ${quoteIdentifier(table)} LIMIT ? OFFSET ?`
      )
      .all(pageSize, page * pageSize) as Record<string, unknown>[];
    return { rows: rawRows.map(serializeRow), total };
  } finally {
    db.close();
  }
}

export type SqlCell = string | number | null;

function normalizeCell(value: unknown, column: TableColumn): SqlCell {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (column.type.toUpperCase().includes("INT")) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? String(value) : parsed;
  }
  return String(value);
}

function columnsOf(db: Database.Database, table: string): TableColumn[] {
  if (!tableExists(db, table)) {
    throw new ApiError(404, `unknown table: ${table}`);
  }
  return db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all() as TableColumn[];
}

export function insertRows(table: string, inputRows: Record<string, unknown>[]): number {
  assertTableName(table);
  requireMasterFile();
  const db = openDb();
  try {
    const columns = columnsOf(db, table);
    const insert = db.transaction((rows: Record<string, unknown>[]) => {
      let rowIndex = 0;
      for (const rawValues of rows) {
        rowIndex += 1;
        // Ô JSON có thể đến dưới dạng object/mảng: đổi thành chuỗi JSON trước khi kiểm tra và bind.
        const values = toCellInputs(rawValues);
        const present = columns.filter(
          (column) => values[column.name] !== undefined && values[column.name] !== ""
        );
        try {
          if (present.length === 0) {
            db.prepare(`INSERT INTO ${quoteIdentifier(table)} DEFAULT VALUES`).run();
            continue;
          }
          const sql = `INSERT INTO ${quoteIdentifier(table)} (${present
            .map((column) => quoteIdentifier(column.name))
            .join(", ")}) VALUES (${present.map(() => "?").join(", ")})`;
          db.prepare(sql).run(...present.map((column) => normalizeCell(values[column.name], column)));
        } catch (raw) {
          const mapped = mapSqliteError(raw);
          throw new ApiError(mapped.status, `Row ${rowIndex} failed: ${mapped.message}`);
        }
      }
    });
    insert(inputRows);
    return inputRows.length;
  } finally {
    db.close();
  }
}

export function updateCells(
  table: string,
  rowid: number,
  cells: Record<string, unknown>
): number {
  assertTableName(table);
  requireMasterFile();
  if (!Number.isInteger(rowid) || rowid < 1) {
    throw new ApiError(400, `invalid rowid: ${rowid}`);
  }
  const db = openDb();
  try {
    const columns = columnsOf(db, table);
    const known = new Set(columns.map((column) => column.name));
    const entries = Object.entries(toCellInputs(cells)).filter(([, value]) => value !== undefined);
    for (const [name] of entries) {
      if (!known.has(name)) {
        throw new ApiError(400, `unknown column: ${name}`);
      }
    }
    if (entries.length === 0) {
      throw new ApiError(400, "body must contain at least one cell");
    }
    const columnBy = new Map(columns.map((column) => [column.name, column]));
    const current = db.prepare(`SELECT 1 FROM ${quoteIdentifier(table)} WHERE rowid = ?`).get(rowid);
    if (current === undefined) {
      throw new ApiError(404, `row ${rowid} not found in ${table}`);
    }
    const sql = `UPDATE ${quoteIdentifier(table)} SET ${entries
      .map(([name]) => `${quoteIdentifier(name)} = ?`)
      .join(", ")} WHERE rowid = ?`;
    try {
      const result = db
        .prepare(sql)
        .run(...entries.map(([name, value]) => normalizeCell(value, columnBy.get(name)!)), rowid);
      return result.changes;
    } catch (raw) {
      throw mapSqliteError(raw);
    }
  } finally {
    db.close();
  }
}

/** Khóa ngoại do SQLite thực thi (`PRAGMA foreign_keys = ON`), nên ON DELETE CASCADE/SET NULL/RESTRICT tự chạy. */
export function deleteRow(table: string, rowid: number): number {
  assertTableName(table);
  requireMasterFile();
  if (!Number.isInteger(rowid) || rowid < 1) {
    throw new ApiError(400, `invalid rowid: ${rowid}`);
  }
  const db = openDb();
  try {
    columnsOf(db, table);
    return db.prepare(`DELETE FROM ${quoteIdentifier(table)} WHERE rowid = ?`).run(rowid).changes;
  } catch (raw) {
    throw mapSqliteError(raw);
  } finally {
    db.close();
  }
}

export function deleteAllRows(table: string): number {
  assertTableName(table);
  requireMasterFile();
  const db = openDb();
  try {
    columnsOf(db, table);
    return db.prepare(`DELETE FROM ${quoteIdentifier(table)}`).run().changes;
  } catch (raw) {
    throw mapSqliteError(raw);
  } finally {
    db.close();
  }
}
