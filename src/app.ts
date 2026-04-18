import cors from "cors";
import express from "express";

import { healthRouter } from "./routes/health.route";
import { ocularRouter } from "./routes/ocular.route";
import { sessionRouter } from "./routes/session.route";
import { stroopRouter } from "./routes/stroop.route";
import { swipeRouter } from "./routes/swipe.route";
import { timerRouter } from "./routes/timer.route";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "SafeGate backend is running" });
});

app.use("/api", healthRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/games/maze", mazeRouter);
app.use("/api/games/memory", memoryRouter);
app.use("/api/games/ocular", ocularRouter);
app.use("/api/games/reflex", reflexRouter);
app.use("/api/games/reverse-type", reverseTypeRouter);
app.use("/api/games/stroop", stroopRouter);
app.use("/api/games/swipe", swipeRouter);
app.use("/api/games/ocular", ocularRouter);
