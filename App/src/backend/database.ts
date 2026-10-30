import initSqlJs, { type BindParams, type Database, type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { ref } from 'vue'
import { migrateRuntime, needsMigration } from './migrate'

// Two SQLite databases, as produced by the Toolkit split step (see public/db/manifest.json):
//   catalog  - read-only content shipped with the app, loaded straight from public/db
//   runtime  - user data; created from runtime-template.db once, then persisted in IndexedDB
// sql.js runs synchronously in memory, so repositories can be called like plain functions.
//
// Foreign keys stay OFF on purpose: runtime tables point at catalog slugs (meal_activity.meal_slug,
// plan_item.meal_slug, shopping_item.ingredient_slug) but live in another file, which SQLite cannot enforce.
// The repositories check slugs against the catalog instead, and delete child rows themselves.

const base = import.meta.env.BASE_URL
const IDB_NAME = 'meal-planner'
const IDB_STORE = 'files'
const RUNTIME_KEY = 'runtime.db'
const BACKUP_KEY = 'runtime.db.bak'

let SQL: SqlJsStatic
let catalog: Database
let runtime: Database
let saveTimer: ReturnType<typeof setTimeout> | undefined

export type Row = Record<string, string | number | null | Uint8Array>

// Bumped after every write so computed values that read the database re-run.
export const dataVersion = ref(0)

async function fetchBytes(path: string): Promise<Uint8Array> {
  const response = await fetch(`${base}${path}`, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Cannot load ${path} (${response.status})`)
  return new Uint8Array(await response.arrayBuffer())
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readStored(): Promise<Uint8Array | null> {
  try {
    const idb = await openIdb()
    return await new Promise((resolve) => {
      const request = idb.transaction(IDB_STORE).objectStore(IDB_STORE).get(RUNTIME_KEY)
      request.onsuccess = () => resolve((request.result as Uint8Array | undefined) ?? null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function writeStored(bytes: Uint8Array, key = RUNTIME_KEY): Promise<void> {
  try {
    const idb = await openIdb()
    await new Promise<void>((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(bytes, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Private mode: the session still works, it just will not persist.
  }
}

export async function openDatabases(): Promise<{ freshRuntime: boolean }> {
  SQL = await initSqlJs({ locateFile: () => wasmUrl })
  catalog = new SQL.Database(await fetchBytes('db/catalog/catalog.db'))
  const stored = await readStored()
  const template = await fetchBytes('db/runtime-template.db')
  runtime = new SQL.Database(stored ?? template)
  const reference = new SQL.Database(template)
  if (stored && needsMigration(runtime, reference)) await writeStored(stored, BACKUP_KEY)
  const report = migrateRuntime(runtime, reference)
  reference.close()
  if (report.error) console.error('[runtime.db] schema upgrade failed, keeping the previous schema:', report.error)
  else if (report.changed) flush()
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush()
  })
  return { freshRuntime: stored === null }
}

export const catalogDb = () => catalog
export const runtimeDb = () => runtime

export function all(db: Database, sql: string, params: BindParams = []): Row[] {
  const statement = db.prepare(sql)
  try {
    statement.bind(params)
    const rows: Row[] = []
    while (statement.step()) rows.push(statement.getAsObject() as Row)
    return rows
  } finally {
    statement.free()
  }
}

export function one(db: Database, sql: string, params: BindParams = []): Row | null {
  return all(db, sql, params)[0] ?? null
}

/** Runs a write on the runtime database; returns the number of rows it changed. */
export function write(sql: string, params: BindParams = []): number {
  runtime.run(sql, params)
  const changed = runtime.getRowsModified()
  touched()
  return changed
}

export function transaction(work: () => void): void {
  runtime.run('BEGIN')
  try {
    work()
    runtime.run('COMMIT')
  } catch (error) {
    runtime.run('ROLLBACK')
    throw error
  }
  touched()
}

function touched() {
  dataVersion.value++
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flush, 300)
}

export function flush() {
  clearTimeout(saveTimer)
  if (runtime) void writeStored(runtime.export())
}
