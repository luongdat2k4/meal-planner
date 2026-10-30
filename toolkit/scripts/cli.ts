import { runPipeline } from "../src_server/tasks/pipeline.js";
import { runExport } from "../src_server/exports/runner.js";

const [kind] = process.argv.slice(2);
if (!kind) {
  console.error("usage: tsx scripts/cli.ts <build|build-recreate|split|verify-split|validate-sqljs|stage>");
  process.exit(1);
}

try {
  if (kind === "stage") {
    await runExport("app-db", console.log);
  } else {
    await runPipeline(kind, console.log, kind === "build-recreate");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
