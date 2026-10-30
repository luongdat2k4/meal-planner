import { ApiError } from "../errors.js";
import { TASKS } from "../project.js";
import { runBuildMaster } from "./build-master.js";
import { runSplitDb } from "./split-db.js";
import { runValidateSqlJs } from "./validate-sqljs.js";
import { runVerifySplit } from "./verify-split.js";
import type { Log, TaskKind } from "./runner.js";

type TaskImpl = (log: Log) => void | Promise<void>;

const IMPLS: Record<string, TaskImpl> = {
  build: (log) => runBuildMaster({ log }),
  "build-recreate": (log) => runBuildMaster({ recreate: true, log }),
  split: (log) => {
    runSplitDb({ log });
  },
  "verify-split": async (log) => {
    await runVerifySplit({ log });
  },
  "validate-sqljs": async (log) => {
    await runValidateSqlJs({ log });
  }
};

export async function runPipeline(kind: TaskKind, log: Log, force: boolean): Promise<void> {
  const task = TASKS.find((candidate) => candidate.kind === kind);
  if (!task) {
    throw new ApiError(400, `unknown task kind: ${kind}`);
  }
  if (task.forceRequired === true && !force) {
    throw new ApiError(400, `${kind} requires force: true`);
  }
  await runTask(kind, log);
}

export async function runTask(kind: TaskKind, log: Log): Promise<void> {
  const impl = IMPLS[kind];
  if (!impl) {
    throw new ApiError(400, `no implementation for task kind: ${kind}`);
  }
  await impl(log);
}
