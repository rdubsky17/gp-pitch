import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // fall back to SQLite database if DATABASE_URL is not provided
    // Path is relative to the schema file location (prisma/ directory)
    url: env("DATABASE_URL") || "file:./data/database.db",
  },
});
