import Database from "better-sqlite3";
import { config } from "../config.js";

export function openDb(options: { readonly?: boolean } = {}): Database.Database {
  const db = new Database(config.masterPath, options.readonly ? { readonly: true } : {});
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 2000");
  return db;
}
