import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    // Falls back to fallback string during setup phase if needed, however Drizzle requires absolute existence of variable for push/migrate
    url: process.env.DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/placeholder",
  },
});
