import { randomUUID } from "node:crypto";

export type TaskKind = string;

export type TaskStatus = "running" | "done" | "error";

export type Log = (line: string) => void;

export interface TaskJob {
  id: string;
  kind: TaskKind;
  status: TaskStatus;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  lines: string[];
}

export type TaskRun = (log: Log) => void | Promise<void>;

const MAX_LOG_LINES = 2000;

class TaskRunner {
  private readonly jobs = new Map<string, TaskJob>();
  private chain: Promise<void> = Promise.resolve();

  enqueue(kind: TaskKind, run: TaskRun): string {
    const id = randomUUID();
    const job: TaskJob = {
      id,
      kind,
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      lines: []
    };
    this.jobs.set(id, job);
    this.chain = this.chain.then(() => this.execute(job, run)).catch(() => {});
    return id;
  }

  private async execute(job: TaskJob, run: TaskRun): Promise<void> {
    const log: Log = (line) => {
      job.lines.push(line);
      if (job.lines.length > MAX_LOG_LINES) {
        job.lines.splice(0, job.lines.length - MAX_LOG_LINES);
      }
    };

    try {
      await run(log);
      job.status = "done";
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);
      job.status = "error";
    } finally {
      job.finishedAt = new Date().toISOString();
    }
  }

  get(id: string): TaskJob | undefined {
    return this.jobs.get(id);
  }

  recent(limit = 20): TaskJob[] {
    return [...this.jobs.values()]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }
}

export const taskRunner = new TaskRunner();
