import { Router, type NextFunction, type Request, type Response } from "express";
import { assertExportExists, runExport } from "../exports/runner.js";
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

export const exportsRouter = Router();

exportsRouter.post(
  "/exports/:id",
  wrap((req, res) => {
    const id = req.params.id;
    assertExportExists(id);
    const jobId = taskRunner.enqueue(`export:${id}`, (log) => runExport(id, log));
    res.status(202).json({ jobId });
  })
);
