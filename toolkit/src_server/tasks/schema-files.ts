import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "../config.js";

export interface SchemaFile {
  name: string;
  sql: string;
  sha256: string;
}

/** Các file `db/schema/*.sql`, theo thứ tự tên (đặt tiền tố số: 001_..., 002_...). */
export function readSchemaFiles(): SchemaFile[] {
  if (!existsSync(config.schemaDir)) {
    return [];
  }
  return readdirSync(config.schemaDir)
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const sql = readFileSync(resolve(config.schemaDir, name), "utf8");
      return { name, sql, sha256: createHash("sha256").update(sql).digest("hex") };
    });
}
