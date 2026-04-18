import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";

export const userRouter = Router();

userRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  if (typeof body.username !== "string" || !body.username.trim()) {
    res.status(400).json({ error: "username is required" });
    return;
  }
  if (typeof body.partner_id !== "string" || !body.partner_id) {
    res.status(400).json({ error: "partner_id is required" });
    return;
  }

  const partner = await prisma.partner.findUnique({ where: { id: body.partner_id } });
  if (!partner) {
    res.status(404).json({ error: "Partner not found", partner_id: body.partner_id });
    return;
  }

  const user = await prisma.user.create({
    data: { username: body.username.trim(), partnerId: body.partner_id },
  });

  res.status(201).json({ _id: user.id, username: user.username, partner_id: user.partnerId });
});

userRouter.get("/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { partner: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({ _id: user.id, username: user.username, partner_id: user.partnerId, partner: user.partner });
});
