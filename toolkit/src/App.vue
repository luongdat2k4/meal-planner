<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import SchemaTree from "@/components/SchemaTree.vue";
import DataGrid from "@/components/DataGrid.vue";
import RowEditor from "@/components/RowEditor.vue";
import type { TaskJob, TaskKind } from "@/api";
import type { SqlValue } from "@/db/query";
import { useDatabase } from "@/composables/useDatabase";

const {
  connected,
  currentTable,
  deleteAllRows,
  deleteRow,
  dirty,
  error,
  insertRows,
  message,
  nextPage,
  page,
  pageSize,
  previousPage,
  project,
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
} = useDatabase();

function tableKind(table: string): string {
  return schema.value.find((item) => item.table === table)?.kind ?? "schema";
}

interface TaskButton {
  kind: TaskKind;
  label: string;
  danger?: boolean;
  confirmText?: string;
  forceRequired?: boolean;
}

const taskButtons = computed<TaskButton[]>(() =>
  project.value.tasks.map((task) => ({
    kind: task.kind as TaskKind,
    label: task.label,
    danger: task.danger,
    confirmText: task.confirmText,
    forceRequired: task.forceRequired
  }))
);

const exportButtons = computed(() => project.value.exports);

interface Notice {
  ok: boolean;
  title: string;
  detail: string;
}

const notice = ref<Notice | null>(null);

function showResult(label: string, job: TaskJob | null): void {
  if (!job) {
    notice.value = { ok: false, title: `${label} failed`, detail: error.value ?? "The job could not be started." };
    return;
  }
  const ok = job.status === "done";
  notice.value = {
    ok,
    title: ok ? `${label} completed` : `${label} failed`,
    detail: ok ? job.lines.slice(-6).join("\n") : (job.error ?? "task failed")
  };
}

// window.confirm bị chặn ở một số trình duyệt nhúng (trả về false, nút như không làm gì), nên dùng hộp trong trang.
const pendingConfirm = ref<{ text: string; run: () => Promise<void> } | null>(null);

async function acceptConfirm(): Promise<void> {
  const pending = pendingConfirm.value;
  pendingConfirm.value = null;
  await pending?.run();
}

function onTask(button: TaskButton): void {
  const run = async (): Promise<void> =>
    showResult(button.label, await startTask(button.kind, button.forceRequired === true));
  if (button.confirmText) {
    pendingConfirm.value = { text: button.confirmText, run };
  } else {
    void run();
  }
}

function onExport(button: { id: string; label: string }): void {
  pendingConfirm.value = {
    text: `${button.label}?`,
    run: async () => showResult(button.label, await startExport(button.id))
  };
}

function confirmDelete(rowid: SqlValue): void {
  void deleteRow(rowid);
}

const metaSummary = computed(() => message.value ?? "connecting...");

const taskLogVisible = ref(false);
let taskLogTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  taskLog,
  (log) => {
    if (taskLogTimer) {
      clearTimeout(taskLogTimer);
      taskLogTimer = undefined;
    }
    if (log.length === 0) {
      taskLogVisible.value = false;
      return;
    }
    taskLogVisible.value = true;
    taskLogTimer = setTimeout(() => {
      taskLogVisible.value = false;
      taskLogTimer = undefined;
    }, 3500);
  }
);

onUnmounted(() => {
  if (taskLogTimer) {
    clearTimeout(taskLogTimer);
  }
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <h1>Meal Planner Toolkit</h1>
        <p v-if="connected">database/master.db - {{ metaSummary }}</p>
        <p v-else>Cannot connect to API server (/api). Check the Vite dev server.</p>
      </div>
      <div class="actions">
        <span class="conn-pill" :class="connected ? 'ok' : 'bad'">
          {{ !connected ? "offline" : dirty ? "dirty - needs export" : "connected" }}
        </span>
      </div>
    </header>

    <div v-if="error" class="status error">{{ error }}</div>
    <div v-else-if="message" class="status">{{ message }}</div>
    <div v-else-if="currentTable" class="status">
      {{
        tableKind(currentTable.table) === "catalog"
          ? "Catalog table - every edit writes directly to database/master.db. Use Export to refresh App/public/db."
          : tableKind(currentTable.table) === "runtime"
            ? "Runtime tables are local test state only and are not exported as catalog."
            : "Schema/internal table."
      }}
    </div>

    <section class="task-panel">
      <div class="task-buttons">
        <button
          v-for="button in taskButtons"
          :key="button.kind"
          type="button"
          :class="{ 'danger-button': button.danger }"
          :disabled="!!runningTask"
          @click="onTask(button)"
        >
          {{ button.label }}
        </button>
        <button
          v-for="target in exportButtons"
          :key="target.id"
          type="button"
          class="secondary-button"
          :disabled="!!runningTask"
          :title="target.description"
          @click="onExport(target)"
        >
          {{ target.label }}
        </button>
        <span v-if="runningTask" class="task-status running">job {{ runningTask.kind }} is running...</span>
        <span v-else-if="taskError" class="task-status error">{{ taskError }}</span>
        <span v-else class="task-status">no job in this session</span>
      </div>
      <pre v-if="taskLogVisible" class="task-log">{{ taskLog.join("\n") }}</pre>
    </section>

    <div v-if="pendingConfirm" class="modal-backdrop" @click.self="pendingConfirm = null">
      <div class="modal" role="alertdialog" aria-modal="true">
        <h2>{{ pendingConfirm.text }}</h2>
        <button type="button" @click="acceptConfirm">OK</button>
        <button type="button" class="secondary-button" @click="pendingConfirm = null">Cancel</button>
      </div>
    </div>

    <div v-if="notice" class="modal-backdrop" @click.self="notice = null">
      <div class="modal" :class="notice.ok ? 'ok' : 'bad'" role="alertdialog" aria-modal="true">
        <h2>{{ notice.title }}</h2>
        <pre v-if="notice.detail">{{ notice.detail }}</pre>
        <button type="button" @click="notice = null">OK</button>
      </div>
    </div>

    <div class="workspace">
      <SchemaTree :schema="schema" :selected-table="selectedTable" :table-kind="tableKind" @select="selectTable" />
      <div class="content-pane">
        <DataGrid
          :table="currentTable"
          :rows="rows"
          :page="page"
          :page-size="pageSize"
          @update-cell="updateCell"
          @delete-all-rows="deleteAllRows"
          @delete-row="confirmDelete"
          @previous-page="previousPage"
          @next-page="nextPage"
        />
      </div>
    </div>
    <RowEditor :table="currentTable" @insert-batch="insertRows" />
  </main>
</template>
