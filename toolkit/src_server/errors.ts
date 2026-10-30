export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function mapSqliteError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  const code = (error as { code?: string } | null)?.code ?? "";
  const message = error instanceof Error ? error.message : String(error);
  if (code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
    return new ApiError(400, message);
  }
  if (code.startsWith("SQLITE_CONSTRAINT")) {
    return new ApiError(409, message);
  }
  if (code === "SQLITE_ERROR") {
    return new ApiError(400, message);
  }
  return new ApiError(500, message);
}
