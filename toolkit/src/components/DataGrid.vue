<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from "vue";
import type { DataRow, SqlValue } from "@/db/query";
import type { TableColumn, TableSchema } from "@/db/schema";

const props = defineProps<{
  table: TableSchema | null;
  rows: DataRow[];
  page: number;
  pageSize: number;
}>();

const emit = defineEmits<{
  updateCell: [rowid: SqlValue, column: TableColumn, value: string];
  deleteAllRows: [];
  deleteRow: [rowid: SqlValue];
  previousPage: [];
  nextPage: [];
}>();

type EditorKind = "json" | "text";

const editorOpen = ref(false);
const editorKind = ref<EditorKind>("text");
const editorRowid = ref<SqlValue>(null);
const editorColumn = ref<TableColumn | null>(null);
const editorText = ref("");
const editorError = ref<string | null>(null);

const filters = reactive<Record<string, string>>({});

watch(
  () => props.table?.table,
  () => {
    closeEditor();
    for (const name of Object.keys(filters)) {
      delete filters[name];
    }
  }
);

function formatValue(value: SqlValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Uint8Array) {
    return `[blob ${value.byteLength} bytes]`;
  }
  return String(value);
}

const visibleRows = computed(() => {
  const active = Object.entries(filters)
    .map(([name, query]) => [name, query.trim().toLowerCase()] as const)
    .filter(([, query]) => query.length > 0);
  if (active.length === 0) {
    return props.rows;
  }
  return props.rows.filter((row) =>
    active.every(([name, query]) => formatValue(row[name]).toLowerCase().includes(query))
  );
});

/** Không còn metadata khai báo kiểu cột: đoán theo tên và kiểu SQL. */
function convFieldKind(_column: TableColumn): string | undefined {
  return undefined;
}

function previewComponent(_row: DataRow, _column: TableColumn): Component | undefined {
  return undefined;
}

function columnLooksJson(column: TableColumn): boolean {
  const name = column.name.toLowerCase();
  const type = column.type.toLowerCase();
  return (
    type.includes("json") ||
    name.endsWith("_json") ||
    name.includes("metadata") ||
    name.includes("payload") ||
    name.includes("config") ||
    name.includes("condition") ||
    name.includes("effect") ||
    name.includes("actions")
  );
}

function valueLooksJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) {
    return false;
  }
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function isJsonCell(column: TableColumn, value: SqlValue): boolean {
  const declared = convFieldKind(column);
  if (declared !== undefined) {
    return declared === "json";
  }
  const text = formatValue(value);
  return columnLooksJson(column) || valueLooksJson(text);
}

function isLongTextCell(column: TableColumn, value: SqlValue): boolean {
  const declared = convFieldKind(column);
  if (declared !== undefined) {
    return declared === "longText";
  }
  const text = formatValue(value);
  const name = column.name.toLowerCase();
  return (
    text.length > 96 ||
    name.includes("description") ||
    name.includes("content") ||
    name.includes("note") ||
    name.includes("message") ||
    name.includes("biography") ||
    name.includes("story")
  );
}

function shouldUseFocusedEditor(column: TableColumn, value: SqlValue): boolean {
  return isJsonCell(column, value) || isLongTextCell(column, value);
}

function summarizeValue(column: TableColumn, value: SqlValue): string {
  const text = formatValue(value);
  if (!text) {
    return "NULL";
  }
  if (value instanceof Uint8Array) {
    return `[blob ${value.byteLength} bytes]`;
  }
  if (isJsonCell(column, value)) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return `${parsed.length} items`;
      }
      if (parsed && typeof parsed === "object") {
        return `${Object.keys(parsed).length} keys`;
      }
    } catch {
      return "Invalid JSON";
    }
  }
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function prettyJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return text;
  }
}

function openEditor(rowid: SqlValue, column: TableColumn, value: SqlValue): void {
  const text = formatValue(value);
  editorRowid.value = rowid;
  editorColumn.value = column;
  editorKind.value = isJsonCell(column, value) ? "json" : "text";
  editorText.value = editorKind.value === "json" ? prettyJson(text) : text;
  editorError.value = null;
  editorOpen.value = true;
}

function closeEditor(): void {
  editorOpen.value = false;
  editorRowid.value = null;
  editorColumn.value = null;
  editorText.value = "";
  editorError.value = null;
}

function minifyJson(): void {
  try {
    editorText.value = JSON.stringify(JSON.parse(editorText.value));
    editorError.value = null;
  } catch (caught) {
    editorError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function formatJson(): void {
  try {
    editorText.value = JSON.stringify(JSON.parse(editorText.value), null, 2);
    editorError.value = null;
  } catch (caught) {
    editorError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function saveEditor(): void {
  const column = editorColumn.value;
  const rowid = editorRowid.value;
  if (!column || rowid === null) {
    return;
  }
  if (editorKind.value === "json") {
    try {
      JSON.parse(editorText.value);
      editorError.value = null;
    } catch (caught) {
      editorError.value = caught instanceof Error ? caught.message : String(caught);
      return;
    }
  }
  emit("updateCell", rowid, column, editorText.value);
  closeEditor();
}

function confirmDeleteAllRows(): void {
  if (!props.table) {
    return;
  }
  const confirmed = window.confirm(
    `Delete all rows from "${props.table.table}"? This cannot be undone.`
  );
  if (confirmed) {
    emit("deleteAllRows");
  }
}
</script>

<template>
  <section class="data-grid">
    <div class="grid-toolbar">
      <div>
        <div class="panel-title">{{ table?.table ?? "Data" }}</div>
        <small v-if="table">{{ table.columns.length }} columns / page {{ page + 1 }} - {{ visibleRows.length }}/{{ rows.length }} rows</small>
      </div>
      <div class="grid-tools">
        <button
          type="button"
          class="danger-button"
          :disabled="!table"
          title="Delete all rows in this table"
          @click="confirmDeleteAllRows"
        >
          Clear table
        </button>
        <div class="pager">
          <button type="button" :disabled="page === 0" title="Previous page" @click="emit('previousPage')">&lt;</button>
          <button type="button" :disabled="rows.length < pageSize" title="Next page" @click="emit('nextPage')">&gt;</button>
        </div>
      </div>
    </div>

    <div v-if="table" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>rowid</th>
            <th v-for="column in table.columns" :key="column.name">
              <div class="column-head">
                <span>{{ column.name }}</span>
                <input
                  class="column-filter"
                  type="search"
                  placeholder="filter"
                  v-model="filters[column.name]"
                />
              </div>
            </th>
            <th class="action-column"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="String(row.__rowid)">
            <td class="rowid">{{ row.__rowid }}</td>
            <td v-for="column in table.columns" :key="column.name">
              <component
                v-if="previewComponent(row, column)"
                :is="previewComponent(row, column)"
                :row="row"
                :column="column"
                :value="row[column.name]"
              />
              <button
                v-else-if="shouldUseFocusedEditor(column, row[column.name])"
                type="button"
                class="cell-preview"
                @click="openEditor(row.__rowid, column, row[column.name])"
              >
                <span class="cell-badge">{{ isJsonCell(column, row[column.name]) ? "JSON" : "TXT" }}</span>
                <span class="cell-summary">{{ summarizeValue(column, row[column.name]) }}</span>
                <span class="cell-count">{{ formatValue(row[column.name]).length }} chars</span>
              </button>
              <input
                v-else
                class="cell-input"
                :value="formatValue(row[column.name])"
                @change="emit('updateCell', row.__rowid, column, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td class="action-column">
              <button type="button" class="icon-danger-button" title="Delete row" @click="emit('deleteRow', row.__rowid)">
                Del
              </button>
            </td>
          </tr>
          <tr v-if="visibleRows.length === 0 && rows.length > 0" class="filter-empty">
            <td :colspan="table.columns.length + 2">No rows match the filter</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">No tables yet. If master.db has not been built, use Build in the task panel.</div>

    <div v-if="editorOpen" class="field-drawer" role="dialog" aria-modal="true">
      <div class="field-drawer-header">
        <div>
          <div class="panel-title">{{ editorColumn?.name }}</div>
          <small>{{ table?.table }} / rowid {{ editorRowid }} / {{ editorKind.toUpperCase() }}</small>
        </div>
        <button type="button" class="ghost-button" @click="closeEditor">Close</button>
      </div>

      <div v-if="editorError" class="editor-error">
        <span>{{ editorError }}</span>
        <button type="button" aria-label="Dismiss error" @click="editorError = null">x</button>
      </div>

      <textarea
        v-model="editorText"
        class="focused-editor"
        :class="{ code: editorKind === 'json' }"
        spellcheck="false"
      ></textarea>

      <div class="field-drawer-footer">
        <span class="char-count">{{ editorText.length }} chars</span>
        <button v-if="editorKind === 'json'" type="button" class="secondary-button" @click="formatJson">Format</button>
        <button v-if="editorKind === 'json'" type="button" class="secondary-button" @click="minifyJson">Minify</button>
        <button type="button" class="secondary-button" @click="closeEditor">Cancel</button>
        <button type="button" class="primary-button" @click="saveEditor">Save</button>
      </div>
    </div>
  </section>
</template>
