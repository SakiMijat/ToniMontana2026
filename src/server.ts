import { app } from "./app";
import { env } from "./constants/env";
import { prisma } from "./lib/prisma";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB via Prisma");

    app.listen(env.PORT, () => {
      console.log(`Server started on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
