import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
});

const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

if (!MONGODB_URI || !MONGODB_DB_NAME) {
  throw new Error(
    "Missing MONGODB_URI or MONGODB_DB_NAME environment variables"
  );
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  MONGODB_URI,
  MONGODB_DB_NAME,
};