import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

export const env = {
  PORT,
  DATABASE_URL,
};
