import { sleepSync } from "./sleep.js";

/**
 * Trên Windows, file vừa ghi thường bị antivirus hoặc trình lập chỉ mục giữ khoảng vài trăm ms,
 * khiến rename/copy/xóa lỗi EBUSY, EPERM hoặc UNKNOWN. Thử lại vài lần trước khi báo lỗi.
 */
const RETRYABLE_CODES = new Set(["EBUSY", "EPERM", "EACCES", "UNKNOWN", "EEXIST"]);

export function withFsRetry<T>(label: string, fn: () => T, attempts = 6, delayMs = 500): T {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code ?? "";
      if (!RETRYABLE_CODES.has(code) || attempt === attempts) break;
      sleepSync(delayMs * attempt);
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label}: ${message}`);
}
