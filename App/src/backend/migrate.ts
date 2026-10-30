import type { BindParams, Database } from 'sql.js'

// Brings a user's runtime.db in line with the runtime-template.db shipped in the app, so a schema change
// made in the Toolkit (Build -> Split -> Stage) never needs the user to reinstall or lose data.
//
// `PRAGMA user_version` of runtime.db records which template schema it matches (a fingerprint of the
// template's tables and indexes). Equal fingerprint -> nothing to do. Otherwise, inside one transaction:
//   - a table missing from runtime.db is created;
//   - a table whose definition differs is rebuilt: renamed aside, recreated from the template,
//     and the rows copied over column by column (new NOT NULL columns get a type default);
//   - indexes are recreated when missing or changed.
// Tables the template no longer has are left alone, because they hold user data.
// Any failure rolls the whole transaction back and leaves runtime.db as it was.

export type MigrationReport = { changed: boolean; created: string[]; rebuilt: string[]; error?: string }

type Entry = { type: 'table' | 'index'; name: string; table: string; sql: string }
type Column = { name: string; type: string; notnull: number; dflt_value: string | null; pk: number }

function rows<T>(db: Database, sql: string, params: BindParams = []): T[] {
  const statement = db.prepare(sql)
  try {
    statement.bind(params)
    const result: T[] = []
    while (statement.step()) result.push(statement.getAsObject() as T)
    return result
  } finally {
    statement.free()
  }
}

const entries = (db: Database): Entry[] =>
  rows<{ type: 'table' | 'index'; name: string; tbl_name: string; sql: string }>(
    db,
    "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN ('table', 'index') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name",
  ).map(row => ({ type: row.type, name: row.name, table: row.tbl_name, sql: row.sql }))

const columns = (db: Database, table: string) => rows<Column>(db, `PRAGMA table_info("${table}")`)

/** Same definition regardless of comments, whitespace, quoting or case. */
const normalize = (sql: string) =>
  sql.replace(/--[^\n]*/g, '').replace(/["`\[\]]/g, '').replace(/\s+/g, ' ').replace(/ ?([(),]) ?/g, '$1')
    .replace(/if not exists /gi, '').trim().toLowerCase()

/** 31-bit FNV-1a over the template schema, small enough for PRAGMA user_version. */
export function schemaVersion(template: Database): number {
  let hash = 0x811c9dc5
  for (const entry of entries(template)) {
    for (const char of `${entry.type}:${entry.name}:${normalize(entry.sql)}\n`) {
      hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0
    }
  }
  return (hash & 0x7fffffff) || 1
}

const userVersion = (db: Database) => Number(rows<{ user_version: number }>(db, 'PRAGMA user_version')[0]?.user_version ?? 0)

export const needsMigration = (runtime: Database, template: Database) => userVersion(runtime) !== schemaVersion(template)

const defaultFor = (type: string) => (/INT|REAL|NUM|BOOL/i.test(type) ? '0' : "''")

function rebuild(runtime: Database, template: Database, entry: Entry) {
  const old = columns(runtime, entry.name).map(column => column.name)
  const select = columns(template, entry.name).flatMap(column => {
    if (old.includes(column.name)) return [{ name: column.name, value: `"${column.name}"` }]
    // A brand new column the old rows cannot fill: use its default, or a neutral value when NOT NULL.
    return column.notnull && column.dflt_value === null && !column.pk ? [{ name: column.name, value: defaultFor(column.type) }] : []
  })
  runtime.run(`ALTER TABLE "${entry.name}" RENAME TO "${entry.name}__old"`)
  runtime.run(entry.sql)
  runtime.run(
    `INSERT INTO "${entry.name}" (${select.map(item => `"${item.name}"`).join(', ')}) SELECT ${select.map(item => item.value).join(', ')} FROM "${entry.name}__old"`,
  )
  runtime.run(`DROP TABLE "${entry.name}__old"`)
}

export function migrateRuntime(runtime: Database, template: Database): MigrationReport {
  const report: MigrationReport = { changed: false, created: [], rebuilt: [] }
  const version = schemaVersion(template)
  if (userVersion(runtime) === version) return report

  runtime.run('PRAGMA foreign_keys = OFF')
  runtime.run('BEGIN')
  try {
    const current = new Map(entries(runtime).map(entry => [`${entry.type}:${entry.name}`, entry]))
    const wanted = entries(template)

    for (const entry of wanted.filter(item => item.type === 'table')) {
      const existing = current.get(`table:${entry.name}`)
      if (!existing) { runtime.run(entry.sql); report.created.push(entry.name) }
      else if (normalize(existing.sql) !== normalize(entry.sql)) { rebuild(runtime, template, entry); report.rebuilt.push(entry.name) }
    }

    // Rebuilding a table drops its indexes, so re-read before deciding which to create.
    const indexes = new Map(entries(runtime).filter(entry => entry.type === 'index').map(entry => [entry.name, entry]))
    for (const entry of wanted.filter(item => item.type === 'index')) {
      const existing = indexes.get(entry.name)
      if (existing && normalize(existing.sql) === normalize(entry.sql)) continue
      if (existing) runtime.run(`DROP INDEX "${entry.name}"`)
      runtime.run(entry.sql)
    }

    runtime.run(`PRAGMA user_version = ${version}`)
    runtime.run('COMMIT')
    report.changed = true
  } catch (error) {
    try { runtime.run('ROLLBACK') } catch { /* No transaction left to roll back. */ }
    report.error = error instanceof Error ? error.message : String(error)
  } finally {
    // Stays OFF: runtime tables reference catalog tables that live in another database file.
    runtime.run('PRAGMA foreign_keys = OFF')
  }
  return report
}
