import Database from "better-sqlite3";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { config } from "../config.js";
import { withFsRetry } from "../fs-retry.js";
import { loadLayout } from "../layout.js";
import type { Log } from "./runner.js";

/** Ghi vào file tạm rồi đổi tên, để App không bao giờ đọc file dở dang. */
function atomicCopy(source: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  const temp = `${dest}.tmp`;
  withFsRetry(`copy ${source}`, () => copyFileSync(source, temp));
  withFsRetry(`rename ${temp}`, () => renameSync(temp, dest));
}

/**
 * Stage: đưa output của Split vào `App/public/db`.
 * 1. copy `database/catalog/*.db` (trừ file trong `appExcluded` của layout), `runtime-template.db`
 *    và `manifest.json` (đã bỏ các file loại trừ);
 * 2. xóa db cũ trong `public/db/catalog` không còn trong lần stage này;
 * 3. xuất `App/public/i18n/<locale>.json` cho mỗi cột ngôn ngữ của bảng
 *    `language` (trừ `id`, `key`), dạng phẳng `{ "<key>": "<text>" }`: khóa như `steak` và `steak.step.oven.3` cùng tồn tại nên không thể lồng theo dấu chấm.
 * Core chạy Split trước (khai ở `EXPORTS[].dependsOn`).
 */
export function runStageApp({ log = console.log }: { log?: Log } = {}): void {
  if (!existsSync(config.catalogDir)) {
    throw new Error(`missing database catalog output: ${config.catalogDir}; chạy task Split trước`);
  }
  if (!existsSync(config.runtimeTemplatePath) || !existsSync(config.manifestPath)) {
    throw new Error("thiếu runtime-template.db hoặc manifest.json; chạy task Split trước");
  }

  // An empty master can be useful while designing schema, but staging it would
  // replace the App's populated catalog with an empty one.
  const master = new Database(config.masterPath, { readonly: true });
  try {
    const hasLanguage = master.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'language'").get();
    if (hasLanguage) {
      const count = (master.prepare("SELECT count(*) AS count FROM language").get() as { count: number }).count;
      if (count === 0) throw new Error("[stage] bảng language trong master.db đang rỗng; chưa thể Stage catalog/i18n vào App");
    }
  } finally {
    master.close();
  }

  const layout = loadLayout();
  const excluded = new Set(layout.appExcluded.map((name) => basename(name)));
  const targetCatalog = resolve(config.stageDir, "catalog");
  mkdirSync(targetCatalog, { recursive: true });

  const catalogFiles = readdirSync(config.catalogDir).filter((name) => name.endsWith(".db") && !excluded.has(name));
  for (const name of catalogFiles) {
    atomicCopy(resolve(config.catalogDir, name), resolve(targetCatalog, name));
  }
  atomicCopy(config.runtimeTemplatePath, resolve(config.stageDir, "runtime-template.db"));

  const manifest = JSON.parse(readFileSync(config.manifestPath, "utf8")) as {
    dbFiles?: Array<{ name: string }>;
  };
  manifest.dbFiles = manifest.dbFiles?.filter((file) => !excluded.has(basename(file.name)));
  const manifestDest = resolve(config.stageDir, "manifest.json");
  const manifestTemp = `${manifestDest}.tmp`;
  writeFileSync(manifestTemp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  withFsRetry(`rename ${manifestTemp}`, () => renameSync(manifestTemp, manifestDest));

  const keep = new Set(catalogFiles);
  for (const name of readdirSync(targetCatalog)) {
    if (name.endsWith(".db") && !keep.has(name)) {
      withFsRetry(`xóa db cũ ${name}`, () => rmSync(resolve(targetCatalog, name)));
      log(`[stage] đã xóa db cũ không còn trong App: ${name}`);
    }
  }
  log(`[stage] copied ${catalogFiles.length + 2} files to ${config.stageDir}`);

  writeI18n(log);
}

function writeI18n(log: Log): void {
  const db = new Database(config.masterPath, { readonly: true });
  try {
    const columns = (db.prepare("PRAGMA table_info(language)").all() as { name: string }[]).map((column) => column.name);
    if (!columns.includes("key")) {
      log("[stage] không có bảng language(key, ...): bỏ qua i18n");
      return;
    }
    const locales = columns.filter((column) => column !== "key" && column !== "id");
    if (locales.some((locale) => !/^[a-z][a-z0-9_-]*$/i.test(locale))) {
      throw new Error("[stage] tên cột ngôn ngữ không hợp lệ để tạo tên file i18n");
    }
    const rows = db.prepare("SELECT * FROM language ORDER BY key").all() as Array<Record<string, string | null> & { key: string }>;
    if (rows.length === 0) {
      log("[stage] bảng language rỗng: giữ nguyên các file i18n hiện có");
      return;
    }
    mkdirSync(config.i18nDir, { recursive: true });
    for (const locale of locales) {
      const map: Record<string, string> = Object.create(null) as Record<string, string>;
      let count = 0;
      for (const row of rows) {
        const value = row[locale];
        if (typeof value === "string" && value.length > 0) {
          map[row.key] = value;
          count++;
        }
      }
      const dest = resolve(config.i18nDir, `${locale}.json`);
      const temp = `${dest}.tmp`;
      writeFileSync(temp, `${JSON.stringify(map, null, 2)}\n`, "utf8");
      withFsRetry(`rename ${temp}`, () => renameSync(temp, dest));
      log(`[stage] i18n/${locale}.json: ${count} khóa`);
    }
    // Remove modules produced by older Toolkit versions after all JSON files are ready.
    for (const name of readdirSync(config.i18nDir)) {
      if (!/^[a-z][a-z0-9_-]*\.js$/i.test(name)) continue;
      const path = resolve(config.i18nDir, name);
      if (readFileSync(path, "utf8").startsWith("export default {")) {
        withFsRetry(`xóa i18n cũ ${name}`, () => rmSync(path));
      }
    }
  } finally {
    db.close();
  }
}
