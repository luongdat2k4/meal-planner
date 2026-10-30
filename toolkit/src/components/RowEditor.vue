<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { TableSchema } from "@/db/schema";

type Mode = "form" | "json" | "file";
type FieldKind = "json" | "text" | "short";
type JsonObject = Record<string, unknown>;

const props = defineProps<{
  table: TableSchema | null;
}>();

const emit = defineEmits<{
  insertBatch: [rows: Record<string, unknown>[]];
}>();

const values = reactive<Record<string, string>>({});
const mode = ref<Mode>("form");
const jsonText = ref("");
const errorMessage = ref<string | null>(null);
const chosenFile = ref<File | null>(null);
const jsonFileInput = ref<HTMLInputElement | null>(null);
const fieldEditorOpen = ref(false);
const activeField = ref<string | null>(null);
const activeFieldKind = ref<Exclude<FieldKind, "short">>("text");
const activeFieldDraft = ref("");
const fieldEditorError = ref<string | null>(null);

const editableColumns = computed(() => props.table?.columns.filter((column) => column.name !== "id") ?? []);

watch(
  () => props.table?.table,
  () => {
    for (const key of Object.keys(values)) {
      delete values[key];
    }
    jsonText.value = "";
    errorMessage.value = null;
    chosenFile.value = null;
    closeFieldEditor();
    if (jsonFileInput.value) {
      jsonFileInput.value.value = "";
    }
  }
);

function columnKind(columnName: string, columnType: string): FieldKind {
  const name = columnName.toLowerCase();
  const type = columnType.toLowerCase();
  if (
    type.includes("json") ||
    name.endsWith("_json") ||
    name.includes("metadata") ||
    name.includes("payload") ||
    name.includes("config") ||
    name.includes("condition") ||
    name.includes("effect") ||
    name.includes("actions")
  ) {
    return "json";
  }
  if (
    name.includes("description") ||
    name.includes("content") ||
    name.includes("note") ||
    name.includes("message") ||
    name.includes("biography") ||
    name.includes("story")
  ) {
    return "text";
  }
  return "short";
}

function compactPreview(value: string): string {
  if (!value) {
    return "Empty";
  }
  return value.length > 72 ? `${value.slice(0, 69)}...` : value;
}

function openFieldEditor(columnName: string, kind: Exclude<FieldKind, "short">) {
  activeField.value = columnName;
  activeFieldKind.value = kind;
  activeFieldDraft.value = kind === "json" ? prettyJson(values[columnName] ?? "") : values[columnName] ?? "";
  fieldEditorError.value = null;
  fieldEditorOpen.value = true;
}

function openColumnEditor(columnName: string, columnType: string) {
  const kind = columnKind(columnName, columnType);
  if (kind === "short") {
    return;
  }
  openFieldEditor(columnName, kind);
}

function closeFieldEditor() {
  fieldEditorOpen.value = false;
  activeField.value = null;
  activeFieldDraft.value = "";
  fieldEditorError.value = null;
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

function formatFieldJson() {
  try {
    activeFieldDraft.value = JSON.stringify(JSON.parse(activeFieldDraft.value), null, 2);
    fieldEditorError.value = null;
  } catch (caught) {
    fieldEditorError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function minifyFieldJson() {
  try {
    activeFieldDraft.value = JSON.stringify(JSON.parse(activeFieldDraft.value));
    fieldEditorError.value = null;
  } catch (caught) {
    fieldEditorError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function saveFieldEditor() {
  if (!activeField.value) {
    return;
  }
  if (activeFieldKind.value === "json" && activeFieldDraft.value.trim()) {
    try {
      JSON.parse(activeFieldDraft.value);
      fieldEditorError.value = null;
    } catch (caught) {
      fieldEditorError.value = caught instanceof Error ? caught.message : String(caught);
      return;
    }
  }
  values[activeField.value] = activeFieldDraft.value;
  closeFieldEditor();
}

function parseSqliteDefault(value: string): string | number | null {
  const text = value.trim();
  if (/^-?\d+$/.test(text)) {
    return Number(text);
  }
  if (text.startsWith("'") && text.endsWith("'") && text.length >= 2) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return null;
}

function fillDefaults() {
  const table = props.table;
  if (!table) {
    return;
  }
  for (const column of table.columns) {
    if (column.name === "id") {
      continue;
    }
    const current = values[column.name];
    if (current !== undefined && current !== "") {
      continue;
    }
    if (column.dflt_value === null) {
      continue;
    }
    const parsed = parseSqliteDefault(column.dflt_value);
    if (parsed === null) {
      continue;
    }
    values[column.name] = String(parsed);
  }
}

function normalizeRow(table: TableSchema, input: JsonObject): JsonObject | string {
  const knownColumns = new Set(table.columns.map((column) => column.name));
  const unknownKeys = Object.keys(input).filter((key) => !knownColumns.has(key));
  if (unknownKeys.length > 0) {
    return `Unknown column${unknownKeys.length === 1 ? "" : "s"}: ${unknownKeys.join(", ")}`;
  }

  const row: JsonObject = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null) {
      continue;
    }
    if (value === true) {
      row[key] = 1;
    } else if (value === false) {
      row[key] = 0;
    } else {
      row[key] = value;
    }
  }

  if (knownColumns.has("id")) {
    const id = row["id"];
    if (id === undefined || id === "") {
      row["id"] = crypto.randomUUID();
    }
  }
  return row;
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJsonObjects(text: string): JsonObject[] | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (caught) {
    return `Invalid JSON: ${caught instanceof Error ? caught.message : String(caught)}`;
  }

  if (Array.isArray(parsed)) {
    if (parsed.some((entry) => !isJsonObject(entry))) {
      return "JSON array must contain only objects";
    }
    return parsed as JsonObject[];
  }
  if (isJsonObject(parsed)) {
    return [parsed];
  }
  return "Expected a JSON object or an array of objects";
}

function jsonToRows(table: TableSchema, text: string): JsonObject[] | string {
  const objects = parseJsonObjects(text);
  if (typeof objects === "string") {
    return objects;
  }
  const rows: JsonObject[] = [];
  for (const object of objects) {
    const normalized = normalizeRow(table, object);
    if (typeof normalized === "string") {
      return normalized;
    }
    rows.push(normalized);
  }
  return rows;
}

function submitForm() {
  errorMessage.value = null;
  const table = props.table;
  if (!table) {
    return;
  }
  const row = normalizeRow(table, { ...values });
  if (typeof row === "string") {
    errorMessage.value = row;
    return;
  }
  emit("insertBatch", [row]);
}

function submitJsonText() {
  errorMessage.value = null;
  const table = props.table;
  if (!table) {
    return;
  }
  const rows = jsonToRows(table, jsonText.value);
  if (typeof rows === "string") {
    errorMessage.value = rows;
    return;
  }
  emit("insertBatch", rows);
  jsonText.value = "";
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  chosenFile.value = input.files?.[0] ?? null;
}

async function submitJsonFile() {
  errorMessage.value = null;
  const table = props.table;
  const file = chosenFile.value;
  if (!table || !file) {
    return;
  }
  let text: string;
  try {
    text = await file.text();
  } catch (caught) {
    errorMessage.value = `Could not read file: ${caught instanceof Error ? caught.message : String(caught)}`;
    return;
  }
  const rows = jsonToRows(table, text);
  if (typeof rows === "string") {
    errorMessage.value = rows;
    return;
  }
  emit("insertBatch", rows);
  chosenFile.value = null;
  if (jsonFileInput.value) {
    jsonFileInput.value.value = "";
  }
}
</script>

<template>
  <section class="row-editor">
    <div class="row-editor-header">
      <div class="panel-title">Insert row</div>

      <div v-if="table" class="row-editor-tabs">
        <button type="button" :class="{ active: mode === 'form' }" @click="mode = 'form'">Form</button>
        <button type="button" :class="{ active: mode === 'json' }" @click="mode = 'json'">JSON string</button>
        <button type="button" :class="{ active: mode === 'file' }" @click="mode = 'file'">JSON file</button>
      </div>
    </div>

    <div v-if="errorMessage" class="editor-error">
      <span>{{ errorMessage }}</span>
      <button type="button" aria-label="Dismiss error" @click="errorMessage = null">x</button>
    </div>

    <form v-if="table && mode === 'form'" class="insert-form" @submit.prevent="submitForm">
      <label v-for="column in editableColumns" :key="column.name">
        <span>{{ column.name }}</span>
        <button
          v-if="columnKind(column.name, column.type) !== 'short'"
          type="button"
          class="field-picker"
          @click="openColumnEditor(column.name, column.type)"
        >
          <span class="cell-badge">{{ columnKind(column.name, column.type) === "json" ? "JSON" : "TXT" }}</span>
          <span class="cell-summary">{{ compactPreview(values[column.name] ?? "") }}</span>
          <span class="cell-count">{{ (values[column.name] ?? "").length }} chars</span>
        </button>
        <div v-else class="input-row">
          <input v-model="values[column.name]" :placeholder="column.type || 'TEXT'" />
        </div>
      </label>
      <button type="button" class="secondary-button" @click="fillDefaults">Fill defaults</button>
      <button class="primary-button" type="submit">Insert</button>
    </form>

    <div v-else-if="table && mode === 'json'" class="json-editor">
      <textarea v-model="jsonText" class="json-textarea" rows="8" placeholder='[{"id": "...", "name": "..."}] or single {...}'></textarea>
      <div class="json-actions">
        <button class="primary-button" type="button" @click="submitJsonText">Insert</button>
      </div>
    </div>

    <div v-else-if="table && mode === 'file'" class="json-editor">
      <div class="json-actions">
        <label class="file-picker">
          Choose .json file
          <input ref="jsonFileInput" class="hidden-file-input" type="file" accept=".json,application/json" @change="onFileChange" />
        </label>
        <button class="primary-button" type="button" :disabled="!chosenFile" @click="submitJsonFile">Insert</button>
      </div>
      <small v-if="chosenFile">File: {{ chosenFile.name }}</small>
    </div>

    <div v-if="fieldEditorOpen" class="field-drawer row-field-drawer" role="dialog" aria-modal="true">
      <div class="field-drawer-header">
        <div>
          <div class="panel-title">{{ activeField }}</div>
          <small>New row / {{ activeFieldKind.toUpperCase() }}</small>
        </div>
        <button type="button" class="ghost-button" @click="closeFieldEditor">Close</button>
      </div>

      <div v-if="fieldEditorError" class="editor-error">
        <span>{{ fieldEditorError }}</span>
        <button type="button" aria-label="Dismiss error" @click="fieldEditorError = null">x</button>
      </div>

      <textarea
        v-model="activeFieldDraft"
        class="focused-editor"
        :class="{ code: activeFieldKind === 'json' }"
        spellcheck="false"
      ></textarea>

      <div class="field-drawer-footer">
        <span class="char-count">{{ activeFieldDraft.length }} chars</span>
        <button v-if="activeFieldKind === 'json'" type="button" class="secondary-button" @click="formatFieldJson">Format</button>
        <button v-if="activeFieldKind === 'json'" type="button" class="secondary-button" @click="minifyFieldJson">Minify</button>
        <button type="button" class="secondary-button" @click="closeFieldEditor">Cancel</button>
        <button type="button" class="primary-button" @click="saveFieldEditor">Apply</button>
      </div>
    </div>
  </section>
</template>
