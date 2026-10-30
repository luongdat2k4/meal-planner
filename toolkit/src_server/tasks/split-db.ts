import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { config } from "../config.js";
import { withFsRetry } from "../fs-retry.js";
import { catalogFileOf, isInternalTable, loadLayout, type Layout } from "../layout.js";
import type { Log } from "./runner.js";

export interface DbFileEntry {
  name: string;
  purpose: string;
  tables: string[];
  sha256: string;
  sizeBytes: number;
}

interface MasterObject {
  type: "table" | "index";
  name: string;
  tbl_name: string;
  sql: string;
}

function quoteIdentifier(identifier: string): string {
  return `"${String(identifier).replaceAll("\"", "\"\"")}"`;
}

function sqlString(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function nextCatalogVersion(): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!existsSync(config.manifestPath)) {
    return `${today}.1`;
  }
  const previous = JSON.parse(readFileSync(config.manifestPath, "utf8")) as { catalogVersion?: unknown; contentVersion?: unknown };
  const match = String(previous.catalogVersion ?? previous.contentVersion ?? "").match(/^(\d{4}-\d{2}-\d{2})\.(\d+)$/);
  if (!match || match[1] !== today) {
    return `${today}.1`;
  }
  return `${today}.${Number(match[2]) + 1}`;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function removeFile(path: string): void {
  if (existsSync(path)) {
    withFsRetry(`xóa ${path}`, () => rmSync(path));
  }
}

function readMasterObjects(masterDb: Database.Database): MasterObject[] {
  return (
    masterDb
      .prepare(
        `SELECT type, name, tbl_name, sql FROM sqlite_master
         WHERE type IN ('table', 'index') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
         ORDER BY rowid`
      )
      .all() as MasterObject[]
  ).filter((object) => !isInternalTable(object.tbl_name));
}

/** Tạo bảng và index giữ nguyên DDL của master (PK, FK, CHECK, DEFAULT), rồi tùy chọn copy dòng. */
function writeDb(
  objects: MasterObject[],
  outPath: string,
  tables: string[],
  copyRows: boolean
): void {
  mkdirSync(dirname(outPath), { recursive: true });
  removeFile(outPath);
  const outDb = new Database(outPath);
  try {
    const selected = new Set(tables);
    for (const object of objects) {
      if (object.type === "table" && selected.has(object.name)) {
        outDb.exec(object.sql);
      }
    }
    for (const object of objects) {
      if (object.type === "index" && selected.has(object.tbl_name)) {
        outDb.exec(object.sql);
      }
    }
    if (copyRows && tables.length > 0) {
      outDb.exec(`ATTACH DATABASE ${sqlString(config.masterPath)} AS master_db`);
      outDb.pragma("foreign_keys = OFF");
      outDb.transaction(() => {
        for (const table of tables) {
          outDb.exec(`INSERT INTO ${quoteIdentifier(table)} SELECT * FROM master_db.${quoteIdentifier(table)}`);
        }
      })();
      outDb.exec("DETACH DATABASE master_db");
    }
    outDb.exec("VACUUM");
  } finally {
    outDb.close();
  }
}

function entryFor(outPath: string, purpose: string, tables: string[]): DbFileEntry {
  return {
    name: relative(config.databaseRoot, outPath).replaceAll("\\", "/"),
    purpose,
    tables,
    sha256: sha256(outPath),
    sizeBytes: statSync(outPath).size
  };
}

/** Cảnh báo khi bảng catalog có FK trỏ sang bảng nằm ở file khác (mở riêng lẻ sẽ không có bảng cha). */
function warnCrossFileForeignKeys(
  masterDb: Database.Database,
  layout: Layout,
  fileOfTable: Map<string, string>,
  log: Log
): void {
  for (const [table, file] of fileOfTable) {
    const fks = masterDb.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)})`).all() as { table: string }[];
    for (const fk of fks) {
      const parentFile = fileOfTable.get(fk.table) ?? (layout.runtime.includes(fk.table) ? "runtime-template.db" : null);
      if (parentFile !== file) {
        log(`[split-db] cảnh báo: ${table} (${file}) có FK tới ${fk.table} (${parentFile ?? "không rõ"}) khác file`);
      }
    }
  }
}

function listCatalogDbs(): string[] {
  if (!existsSync(config.catalogDir)) {
    return [];
  }
  return readdirSync(config.catalogDir)
    .filter((name) => name.endsWith(".db"))
    .map((name) => resolve(config.catalogDir, name));
}

export interface SplitDbOptions {
  log?: Log;
  catalogVersion?: string;
}

export function runSplitDb({
  log = console.log,
  catalogVersion
}: SplitDbOptions = {}): { catalogVersion: string; dbFileCount: number } {
  if (!existsSync(config.masterPath)) {
    throw new Error(`missing master db at ${config.masterPath}; chạy task Build trước`);
  }

  const layout = loadLayout();
  const version = catalogVersion ?? nextCatalogVersion();
  const masterDb = new Database(config.masterPath, { readonly: true });
  const dbFiles: DbFileEntry[] = [];
  const tableIndex: Record<string, string> = {};

  try {
    const objects = readMasterObjects(masterDb);
    const tables = objects.filter((object) => object.type === "table").map((object) => object.name);

    for (const [file, listed] of Object.entries(layout.groups)) {
      for (const table of listed) {
        if (!tables.includes(table)) {
          throw new Error(`db/layout.json: bảng "${table}" (nhóm ${file}) không có trong master.db`);
        }
      }
    }
    for (const table of layout.runtime) {
      if (!tables.includes(table)) {
        throw new Error(`db/layout.json: bảng runtime "${table}" không có trong master.db`);
      }
    }

    const byFile = new Map<string, string[]>();
    const fileOfTable = new Map<string, string>();
    for (const table of tables) {
      const file = catalogFileOf(layout, table);
      if (file === null) continue;
      fileOfTable.set(table, file);
      byFile.set(file, [...(byFile.get(file) ?? []), table]);
    }

    mkdirSync(config.catalogDir, { recursive: true });
    // File catalog cũ không còn trong layout thì xóa, để manifest và thư mục khớp nhau.
    const expected = new Set([...byFile.keys()].map((file) => resolve(config.databaseRoot, file)));
    for (const stale of listCatalogDbs()) {
      if (!expected.has(stale)) {
        removeFile(stale);
        log(`[split-db] đã xóa db cũ không còn trong layout: ${relative(config.databaseRoot, stale)}`);
      }
    }

    for (const [file, fileTables] of byFile) {
      const outPath = resolve(config.databaseRoot, file);
      writeDb(objects, outPath, fileTables, true);
      dbFiles.push(entryFor(outPath, file.replace(/^catalog\//, "").replace(/\.db$/, ""), fileTables));
      for (const table of fileTables) tableIndex[table] = file;
    }

    writeDb(objects, config.runtimeTemplatePath, layout.runtime, false);
    dbFiles.push(entryFor(config.runtimeTemplatePath, "runtime-template", layout.runtime));
    for (const table of layout.runtime) tableIndex[table] = "runtime-template.db";

    warnCrossFileForeignKeys(masterDb, layout, fileOfTable, log);
  } finally {
    masterDb.close();
  }

  const manifest = {
    formatVersion: 1,
    catalogVersion: version,
    generatedAt: new Date().toISOString(),
    dbFiles,
    tableIndex
  };
  writeFileSync(config.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`[split-db] catalogVersion ${version}`);
  log(`[split-db] wrote ${dbFiles.length} db files and manifest.json`);
  return { catalogVersion: version, dbFileCount: dbFiles.length };
}
