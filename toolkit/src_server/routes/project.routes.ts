import { Router } from "express";
import { EXPORTS, TASKS } from "../project.js";

export const projectRouter = Router();

/** Tác vụ và export mà giao diện hiển thị thành nút. */
projectRouter.get("/project", (_req, res) => {
  res.json({ tasks: TASKS, exports: EXPORTS });
});
