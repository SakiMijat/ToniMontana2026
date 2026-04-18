import { Router, type Request, type Response } from "express";

import { prisma } from "../lib/prisma";

export const sessionRouter = Router();

const DEMO_EMAIL = "demo@safegate.app";
const DEMO_NAME = "Demo Driver";

/**
 * POST /api/sessions/start
 *
 * Creates (or reuses) a demo user and opens a fresh Session in PENDING status.
 * Returns the sessionId that the frontend will carry through every game.
 *
 * Body (optional): { email?: string, name?: string }
 * Response 200: { sessionId, userId, status }
 */
sessionRouter.post("/start", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { email?: unknown; name?: unknown };
  const email = typeof body.email === "string" && body.email ? body.email : DEMO_EMAIL;
  const name = typeof body.name === "string" && body.name ? body.name : DEMO_NAME;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });

  const session = await prisma.session.create({
    data: { userId: user.id },
  });

  res.status(200).json({
    sessionId: session.id,
    userId: user.id,
    status: session.status,
  });
});
