import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
    path: path.resolve(process.cwd(), "../.env"),
});

const { MONGODB_URI, MONGODB_DB_NAME, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CLIENT_ORIGIN } = process.env;

if (!MONGODB_URI || !MONGODB_DB_NAME || !BETTER_AUTH_SECRET || !BETTER_AUTH_URL || !CLIENT_ORIGIN) {
    throw new Error(
        "Missing environment variables"
    );
}

export const env = {
    PORT: Number(process.env.PORT) || 3000,
    MONGODB_URI,
    MONGODB_DB_NAME,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    CLIENT_ORIGIN
};