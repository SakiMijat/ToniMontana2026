import cors from "cors";
import express from "express";

import { healthRouter } from "./routes/health.route";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "SafeGate backend is running" });
});

app.use("/api", healthRouter);
