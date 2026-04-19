import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { healthRouter } from "./routes/health.route";
import { ocularRouter } from "./routes/ocular.route";
import { partnerRouter } from "./routes/partner.route";
import { sessionRouter } from "./routes/session.route";
// import { swipeRouter } from "./routes/swipe.route";
import { userRouter } from "./routes/user.route";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "SafeGate backend is running" });
});

app.use("/api", healthRouter);
app.use("/api/partners", partnerRouter);
app.use("/api/users", userRouter);
app.use("/api/sessions", sessionRouter);
// app.use("/api/games/swipe", swipeRouter);
app.use("/api/games/ocular", ocularRouter);

// Global error handler — catches any unhandled error thrown from async route handlers
// so the process never crashes on a DB timeout or unexpected exception.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[app] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});
