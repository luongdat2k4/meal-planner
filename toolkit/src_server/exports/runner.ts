import { ApiError } from "../errors.js";
import { EXPORTS, TASKS } from "../project.js";
import { runStageApp } from "../tasks/stage-app.js";
import { runTask } from "../tasks/pipeline.js";
import type { Log } from "../tasks/runner.js";

const IMPLS: Record<string, (log: Log) => void | Promise<void>> = {
  "app-db": (log) => runStageApp({ log })
};

function findExport(id: string) {
  return EXPORTS.find((target) => target.id === id);
}

export function assertExportExists(id: string): void {
  if (!findExport(id)) {
    throw new ApiError(400, `unknown export target: ${id}`);
  }
}

export async function runExport(id: string, log: Log): Promise<void> {
  assertExportExists(id);
  const impl = IMPLS[id];
  if (!impl) {
    throw new ApiError(400, `no implementation for export target: ${id}`);
  }
  for (const kind of findExport(id)?.dependsOn ?? []) {
    const task = TASKS.find((candidate) => candidate.kind === kind);
    if (!task) {
      throw new ApiError(400, `export ${id} phụ thuộc task không tồn tại: ${kind}`);
    }
    if (task.forceRequired === true) {
      throw new ApiError(400, `export ${id} không được phụ thuộc task cần force: ${kind}`);
    }
    log(`[export ${id}] chạy task ${kind} trước`);
    await runTask(kind, log);
  }
  await impl(log);
}
