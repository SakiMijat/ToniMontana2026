import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SafeGate backend",
    timestamp: new Date().toISOString(),
  });
});
