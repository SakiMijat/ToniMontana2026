import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";

export const partnerRouter = Router();

partnerRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const partner = await prisma.partner.create({
    data: { name: body.name.trim() },
  });

  res.status(201).json(partner);
});

partnerRouter.get("/", async (_req: Request, res: Response) => {
  const partners = await prisma.partner.findMany();
  res.status(200).json(partners);
});

partnerRouter.get("/:id", async (req: Request, res: Response) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.params.id },
    include: { users: true },
  });

  if (!partner) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }

  res.status(200).json(partner);
});
