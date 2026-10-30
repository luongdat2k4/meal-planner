import type { DataRow } from "@/db/query";
import type { TableSchema } from "@/db/schema";

export interface DbMeta {
  fileExists: boolean;
  path: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
  tableCount: number | null;
}

export interface RowsResult {
  rows: DataRow[];
  total: number;
}

export type TaskKind = string;

export type TaskStatus = "running" | "done" | "error";

export interface TaskJob {
  id: string;
  kind: TaskKind;
  status: TaskStatus;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  lines: string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Keep body null for non-JSON responses.
  }
  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error ?? `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export function fetchDbMeta(): Promise<DbMeta> {
  return request<DbMeta>("/api/db/meta");
}

export function fetchSchema(): Promise<TableSchema[]> {
  return request<TableSchema[]>("/api/db/schema");
}

export function fetchRows(table: string, page: number, pageSize: number): Promise<RowsResult> {
  return request<RowsResult>(`/api/db/tables/${encodeURIComponent(table)}/rows?page=${page}&pageSize=${pageSize}`);
}

export function insertRows(table: string, rows: Record<string, unknown>[]): Promise<{ inserted: number }> {
  return request<{ inserted: number }>(`/api/db/tables/${encodeURIComponent(table)}/rows`, {
    method: "POST",
    body: JSON.stringify(rows)
  });
}

export function updateCells(
  table: string,
  rowid: number,
  cells: Record<string, unknown>
): Promise<{ updated: number }> {
  return request<{ updated: number }>(`/api/db/tables/${encodeURIComponent(table)}/rows/${rowid}`, {
    method: "PATCH",
    body: JSON.stringify(cells)
  });
}

export function deleteRow(table: string, rowid: number): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(`/api/db/tables/${encodeURIComponent(table)}/rows/${rowid}`, {
    method: "DELETE"
  });
}

export function deleteAllRows(table: string): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(`/api/db/tables/${encodeURIComponent(table)}/rows`, {
    method: "DELETE"
  });
}

export function startTask(kind: TaskKind, force = false): Promise<{ jobId: string }> {
  return request<{ jobId: string }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ kind, force })
  });
}

export interface TaskDef {
  kind: string;
  label: string;
  danger?: boolean;
  confirmText?: string;
  forceRequired?: boolean;
}

export interface ExportDef {
  id: string;
  label: string;
  description: string;
}

export interface ProjectInfo {
  tasks: TaskDef[];
  exports: ExportDef[];
}

export function fetchProject(): Promise<ProjectInfo> {
  return request<ProjectInfo>("/api/project");
}

export function startExport(id: string): Promise<{ jobId: string }> {
  return request<{ jobId: string }>(`/api/exports/${encodeURIComponent(id)}`, {
    method: "POST"
  });
}

export function fetchTask(jobId: string): Promise<TaskJob> {
  return request<TaskJob>(`/api/tasks/${jobId}`);
}
