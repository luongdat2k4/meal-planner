import { Router, type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../errors.js";
import {
  deleteAllRows,
  deleteRow,
  getMasterMeta,
  getRows,
  getSchema,
  insertRows,
  updateCells
} from "../db/crud.js";

type Handler = (req: Request, res: Response) => void;

function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

export const dbRouter = Router();

dbRouter.get(
  "/db/meta",
  wrap((_req, res) => {
    res.json(getMasterMeta());
  })
);

dbRouter.get(
  "/db/schema",
  wrap((_req, res) => {
    res.json(getSchema());
  })
);

dbRouter.get(
  "/db/tables/:table/rows",
  wrap((req, res) => {
    const table = req.params.table;
    const page = Math.max(0, Number(req.query.page ?? 0) || 0);
    const pageSize = Math.min(1000, Math.max(1, Number(req.query.pageSize ?? 200) || 200));
    res.json(getRows(table, page, pageSize));
  })
);

function parseRowid(raw: string): number {
  const rowid = Number(raw);
  if (!Number.isInteger(rowid) || rowid < 1) {
    throw new ApiError(400, `invalid rowid: ${raw}`);
  }
  return rowid;
}

function parseRowArray(body: unknown): Record<string, unknown>[] {
  if (!Array.isArray(body)) {
    throw new ApiError(400, "body must be an array of row objects");
  }
  for (const row of body) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      throw new ApiError(400, "body must be an array of row objects");
    }
  }
  return body as Record<string, unknown>[];
}

dbRouter.post(
  "/db/tables/:table/rows",
  wrap((req, res) => {
    const rows = parseRowArray(req.body);
    const inserted = insertRows(req.params.table, rows);
    res.status(201).json({ inserted });
  })
);

dbRouter.patch(
  "/db/tables/:table/rows/:rowid",
  wrap((req, res) => {
    const cells = req.body;
    if (cells === null || typeof cells !== "object" || Array.isArray(cells)) {
      throw new ApiError(400, "body must be an object of { column: value }");
    }
    const updated = updateCells(req.params.table, parseRowid(req.params.rowid), cells);
    res.json({ updated });
  })
);

dbRouter.delete(
  "/db/tables/:table/rows/:rowid",
  wrap((req, res) => {
    const deleted = deleteRow(req.params.table, parseRowid(req.params.rowid));
    res.json({ deleted });
  })
);

dbRouter.delete(
  "/db/tables/:table/rows",
  wrap((req, res) => {
    const deleted = deleteAllRows(req.params.table);
    res.json({ deleted });
  })
);
