/** Chờ đồng bộ (dùng trong tác vụ server, không ở luồng HTTP nóng). */
export function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
