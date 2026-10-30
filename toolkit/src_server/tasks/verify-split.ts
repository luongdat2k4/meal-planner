import Database from "better-sqlite3";
import initSqlJs from "sql.js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "../config.js";
import type { Log } from "./runner.js";

interface ManifestDbFile {
  name: string;
  purpose: string;
  tables: string[];
  sha256: string;
}

interface Manifest {
  catalogVersion: string;
  dbFiles: ManifestDbFile[];
}

export interface VerifySplitOptions {
  log?: Log;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function tableNames(db: Database.Database): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[]
  ).map((row) => row.name);
}

function count(db: Database.Database, table: string): number {
  return (db.prepare(`SELECT count(*) AS c FROM ${quoteIdentifier(table)}`).get() as { c: number }).c;
}

/**
 * Kiểm tra output của Split: đúng bảng theo manifest, sha256 khớp, số dòng catalog khớp master.db,
 * runtime-template không có dòng nào, và mọi db đọc được bằng sql.js (engine đọc file của App).
 */
export async function runVerifySplit({
  log = console.log
}: VerifySplitOptions = {}): Promise<{ dbFileCount: number; catalogVersion: string }> {
  if (!existsSync(config.manifestPath)) {
    throw new Error(`missing manifest at ${config.manifestPath}; chạy task Split trước`);
  }
  if (!existsSync(config.masterPath)) {
    throw new Error(`missing master db at ${config.masterPath}; chạy task Build trước`);
  }

  const manifest = JSON.parse(readFileSync(config.manifestPath, "utf8")) as Manifest;
  const master = new Database(config.masterPath, { readonly: true });

  try {
    for (const file of manifest.dbFiles) {
      const dbPath = resolve(config.databaseRoot, file.name);
      if (!existsSync(dbPath)) {
        throw new Error(`${file.name}: file không tồn tại; chạy task Split lại`);
      }
      const hash = createHash("sha256").update(readFileSync(dbPath)).digest("hex");
      if (hash !== file.sha256) {
        throw new Error(`${file.name}: sha256 không khớp manifest; chạy task Split lại`);
      }

      const db = new Database(dbPath, { readonly: true });
      try {
        const tables = tableNames(db);
        const expected = [...file.tables].sort((a, b) => a.localeCompare(b));
        if (JSON.stringify(tables) !== JSON.stringify(expected)) {
          throw new Error(`${file.name} table mismatch: expected ${expected.join(", ")} got ${tables.join(", ")}`);
        }
        for (const table of expected) {
          const rows = count(db, table);
          if (file.purpose === "runtime-template") {
            if (rows !== 0) throw new Error(`${file.name}: bảng ${table} phải rỗng, có ${rows} dòng`);
          } else {
            const masterRows = count(master, table);
            if (rows !== masterRows) {
              throw new Error(`${file.name}: bảng ${table} có ${rows} dòng, master.db có ${masterRows}`);
            }
          }
        }
      } finally {
        db.close();
      }
    }
  } finally {
    master.close();
  }

  const SQL = await initSqlJs({
    locateFile: (file) => join(config.sqlJsDistDir, file)
  });
  for (const file of manifest.dbFiles) {
    const dbPath = resolve(config.databaseRoot, file.name);
    const sqlJsDb = new SQL.Database(readFileSync(dbPath));
    try {
      let rowTotal = 0;
      for (const table of file.tables) {
        const result = sqlJsDb.exec(`SELECT count(*) AS count FROM ${quoteIdentifier(table)}`);
        rowTotal += Number(result[0]?.values[0]?.[0] ?? 0);
      }
      log(`[verify-split] ${file.name}: ${file.tables.length} tables, ${rowTotal} rows`);
    } finally {
      sqlJsDb.close();
    }
  }

  log(`[verify-split] verified ${manifest.dbFiles.length} db files from manifest ${manifest.catalogVersion}`);
  return { dbFileCount: manifest.dbFiles.length, catalogVersion: manifest.catalogVersion };
}
