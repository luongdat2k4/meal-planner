import express, { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "./errors.js";
import { dbRouter } from "./routes/db.routes.js";
import { exportsRouter } from "./routes/exports.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { tasksRouter } from "./routes/tasks.routes.js";

export function buildApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "meal-planner-toolkit-server", time: new Date().toISOString() });
  });

  app.use(projectRouter);
  app.use(dbRouter);
  app.use(tasksRouter);
  app.use(exportsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("[meal-planner-toolkit-server]", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  });

  return app;
}
