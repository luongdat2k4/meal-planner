import { computed, onUnmounted, ref } from "vue";
import type { DataRow, SqlValue } from "@/db/query";
import type { TableColumn, TableSchema } from "@/db/schema";
import * as api from "@/api";

const schema = ref<TableSchema[]>([]);
const selectedTable = ref<string | null>(null);
const rows = ref<DataRow[]>([]);
const page = ref(0);
const pageSize = 200;
const loading = ref(false);
const message = ref<string | null>(null);
const error = ref<string | null>(null);
const meta = ref<api.DbMeta | null>(null);
const connected = ref(false);
const project = ref<api.ProjectInfo>({ tasks: [], exports: [] });
const dirty = ref(false);

const runningTask = ref<api.TaskJob | null>(null);
const taskLog = ref<string[]>([]);
const taskError = ref<string | null>(null);
let pollTimer: number | undefined;

function sqliteError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

function setError(value: unknown): void {
  error.value = sqliteError(value);
}

async function loadRows(): Promise<void> {
  const table = selectedTable.value;
  if (!table) {
    rows.value = [];
    return;
  }
  const result = await api.fetchRows(table, page.value, pageSize);
  rows.value = result.rows;
}

async function loadSchemaList(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    schema.value = await api.fetchSchema();
    selectedTable.value = schema.value[0]?.table ?? null;
    page.value = 0;
    await loadRows();
  } catch (caught) {
    setError(caught);
  } finally {
    loading.value = false;
  }
}

async function refreshMeta(): Promise<void> {
  meta.value = await api.fetchDbMeta();
}

async function selectTable(table: string): Promise<void> {
  selectedTable.value = table;
  page.value = 0;
  error.value = null;
  try {
    await loadRows();
  } catch (caught) {
    setError(caught);
  }
}

function nextPage(): void {
  if (!selectedTable.value || rows.value.length < pageSize) {
    return;
  }
  page.value += 1;
  void loadRows();
}

function previousPage(): void {
  if (!selectedTable.value || page.value === 0) {
    return;
  }
  page.value -= 1;
  void loadRows();
}

async function afterWrite(doneMessage: string): Promise<void> {
  dirty.value = true;
  message.value = doneMessage;
  error.value = null;
  try {
    await loadRows();
    await refreshMeta();
  } catch (caught) {
    setError(caught);
  }
}

async function insertRows(inputRows: Record<string, unknown>[]): Promise<void> {
  const table = selectedTable.value;
  if (!table || inputRows.length === 0) {
    return;
  }
  try {
    await api.insertRows(table, inputRows);
    await afterWrite(inputRows.length === 1 ? "Inserted 1 row into database/master.db" : `Inserted ${inputRows.length} rows`);
  } catch (caught) {
    setError(caught);
  }
}

async function updateCell(rowid: SqlValue, column: TableColumn, value: string): Promise<void> {
  if (!selectedTable.value) {
    return;
  }
  try {
    await api.updateCells(selectedTable.value, Number(rowid), { [column.name]: value });
    await afterWrite(`Cell ${column.name} updated`);
  } catch (caught) {
    setError(caught);
  }
}

async function deleteRow(rowid: SqlValue): Promise<void> {
  if (!selectedTable.value) {
    return;
  }
  try {
    await api.deleteRow(selectedTable.value, Number(rowid));
    await afterWrite("Row deleted");
  } catch (caught) {
    setError(caught);
  }
}

async function deleteAllRows(): Promise<void> {
  if (!selectedTable.value) {
    return;
  }
  try {
    const result = await api.deleteAllRows(selectedTable.value);
    page.value = 0;
    await afterWrite(
      result.deleted === 1 ? "Deleted 1 row" : `Deleted ${result.deleted} rows`
    );
  } catch (caught) {
    setError(caught);
  }
}

function stopPolling(): void {
  if (pollTimer !== undefined) {
    window.clearTimeout(pollTimer);
    pollTimer = undefined;
  }
}

function pollJob(jobId: string): Promise<api.TaskJob> {
  return new Promise((resolve) => {
    const tick = async (): Promise<void> => {
      try {
        const job = await api.fetchTask(jobId);
        runningTask.value = job;
        taskLog.value = [...job.lines];
        if (job.status === "error") {
          taskError.value = job.error ?? "task failed";
        }
        if (job.status === "done" || job.status === "error") {
          runningTask.value = null;
          if (job.status === "done" && (job.kind === "split" || job.kind.startsWith("export:"))) {
            dirty.value = false;
          }
          if (job.status === "done") {
            message.value = `Job ${job.kind} done`;
            void refreshMeta();
          } else {
            message.value = null;
          }
          resolve(job);
          return;
        }
        pollTimer = window.setTimeout(() => void tick(), 500);
      } catch {
        pollTimer = window.setTimeout(() => void tick(), 1000);
      }
    };
    void tick();
  });
}

async function startJob(kind: string, start: () => Promise<{ jobId: string }>): Promise<api.TaskJob | null> {
  if (runningTask.value) {
    return null;
  }
  taskError.value = null;
  error.value = null;
  taskLog.value = [];
  message.value = `Job ${kind} started...`;
  try {
    const { jobId } = await start();
    return await pollJob(jobId);
  } catch (caught) {
    runningTask.value = null;
    setError(caught);
    return null;
  }
}

async function startTask(kind: api.TaskKind, force = false): Promise<api.TaskJob | null> {
  return startJob(kind, () => api.startTask(kind, force));
}

async function startExport(id: string): Promise<api.TaskJob | null> {
  return startJob(`export:${id}`, () => api.startExport(id));
}

let initialized = false;
async function init(): Promise<void> {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    await refreshMeta();
    connected.value = true;
    project.value = await api.fetchProject();
    if (meta.value?.fileExists) {
      await loadSchemaList();
    } else {
      message.value = "database/master.db has not been built yet. Use Build in the task panel.";
    }
  } catch (caught) {
    connected.value = false;
    error.value = `Cannot connect to API server (/api): ${sqliteError(caught)}`;
  }
}

void init();

const currentTable = computed(() => schema.value.find((table) => table.table === selectedTable.value) ?? null);

export function useDatabase() {
  onUnmounted(stopPolling);
  return {
    connected,
    deleteAllRows,
    currentTable,
    deleteRow,
    dirty,
    error,
    insertRows,
    loading,
    message,
    meta,
    project,
    nextPage,
    page,
    pageSize,
    previousPage,
    rows,
    runningTask,
    schema,
    selectTable,
    selectedTable,
    startExport,
    startTask,
    taskError,
    taskLog,
    updateCell
  };
}
