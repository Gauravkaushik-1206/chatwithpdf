import * as dotenv from "dotenv";
dotenv.config({ path: ".env"})

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

// npx drizzle-kit push:pg 