import { Router, type NextFunction, type Request, type Response } from "express";
import { TASKS } from "../project.js";
import { ApiError } from "../errors.js";
import { runPipeline } from "../tasks/pipeline.js";
import { taskRunner } from "../tasks/runner.js";

type Handler = (req: Request, res: Response) => void | Promise<void>;

function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      Promise.resolve(handler(req, res)).catch(next);
    } catch (error) {
      next(error);
    }
  };
}

export const tasksRouter = Router();

tasksRouter.post(
  "/tasks",
  wrap((req, res) => {
    const body = (req.body ?? {}) as { kind?: unknown; force?: unknown };
    const kind = body.kind;
    const task = typeof kind === "string" ? TASKS.find((item) => item.kind === kind) : undefined;
    if (!task) {
      throw new ApiError(400, `unknown task kind: ${String(kind)}`);
    }

    const force = body.force === true;
    if (task.forceRequired === true && !force) {
      throw new ApiError(400, `${task.kind} requires force: true`);
    }

    const jobId = taskRunner.enqueue(task.kind, (log) => runPipeline(task.kind, log, force));
    res.status(202).json({ jobId });
  })
);

tasksRouter.get(
  "/tasks",
  wrap((_req, res) => {
    res.json({ tasks: taskRunner.recent(20) });
  })
);

tasksRouter.get(
  "/tasks/:id",
  wrap((req, res) => {
    const job = taskRunner.get(req.params.id);
    if (!job) {
      throw new ApiError(404, `unknown job: ${req.params.id}`);
    }
    res.json(job);
  })
);
