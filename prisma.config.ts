import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // fall back to a local sqlite file if DATABASE_URL is not provided
    url: env("DATABASE_URL") || "file:./dev.db",
  },
});
