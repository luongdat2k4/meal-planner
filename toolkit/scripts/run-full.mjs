import { spawn } from "node:child_process";

const scripts = ["dev", "server:standalone"];
const procs = scripts.map((name) =>
  spawn("npm", ["run", name], { stdio: "inherit", shell: true })
);

let exiting = false;
function shutdown(code) {
  if (exiting) return;
  exiting = true;
  for (const p of procs) {
    if (p.exitCode === null && !p.killed) p.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
for (const p of procs) {
  p.on("exit", (code) => shutdown(code ?? 0));
}
