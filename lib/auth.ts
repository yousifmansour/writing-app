import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/lib/env";
import { mongoClient, mongoDb } from "@/lib/mongodb";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(mongoDb, { client: mongoClient }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
