import express from "express";
import { buildApp } from "./app.js";

const port = Number(process.env.TOOLKIT_SERVER_PORT ?? 4001);
const app = express();
app.use("/api", buildApp());
app.listen(port, "127.0.0.1", () => {
  console.log(`[meal-planner-toolkit-server] listening on http://127.0.0.1:${port}/api`);
});
