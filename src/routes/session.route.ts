import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";

export const sessionRouter = Router();

const DEFAULT_USER_ID = "69e3eb5598104d8fbdd39074";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

sessionRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const userId = (typeof body.user_id === "string" && body.user_id) ? body.user_id : DEFAULT_USER_ID;

  const oneHourAgo = new Date(Date.now() - COOLDOWN_MS);
  const lastDenied = await prisma.session.findFirst({
    where: { userId, result: "DENIED", endTime: { gte: oneHourAgo } },
    orderBy: { endTime: "desc" },
  });

  if (lastDenied?.endTime) {
    const unlocksAt = new Date(lastDenied.endTime.getTime() + COOLDOWN_MS);
    res.status(429).json({ error: "COOLDOWN", unlocks_at: unlocksAt.toISOString() });
    return;
  }

  const session = await prisma.session.create({ data: { userId } });

  res.status(201).json({
    _id: session.id,
    user_id: session.userId,
    result: session.result,
    start_time: session.startTime,
    end_time: session.endTime,
  });
});

sessionRouter.patch("/:id/finish", async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const validResults = ["APPROVED", "DENIED"];

  if (!validResults.includes(body.result as string)) {
    res.status(400).json({ error: "result must be APPROVED | DENIED" });
    return;
  }

  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const updated = await prisma.session.update({
    where: { id: req.params.id },
    data: { result: body.result as "APPROVED" | "DENIED", endTime: new Date() },
  });

  res.status(200).json({
    _id: updated.id,
    user_id: updated.userId,
    result: updated.result,
    start_time: updated.startTime,
    end_time: updated.endTime,
  });
});

sessionRouter.get("/:id", async (req: Request, res: Response) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { gameResults: true },
  });

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(200).json({
    _id: session.id,
    user_id: session.userId,
    result: session.result,
    start_time: session.startTime,
    end_time: session.endTime,
    gameResults: session.gameResults,
  });
});
