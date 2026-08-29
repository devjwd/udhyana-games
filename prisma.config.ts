import { defineConfig } from "@prisma/config";
import { config } from "dotenv";

config({ path: ".env" });

export default defineConfig({
  schema: "src/backend/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    // @ts-expect-error - Prisma 7 config types might be out of date
    directUrl: process.env.DIRECT_URL,
  },
});
