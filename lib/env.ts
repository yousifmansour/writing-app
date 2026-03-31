const fallbackAppUrl = "http://localhost:3000";
const fallbackMongoUrl = "mongodb://localhost:27018/writing-app";
const fallbackAuthSecret = "development-secret-change-this-before-production";

export const env = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? fallbackAppUrl,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? fallbackAuthSecret,
  MONGODB_URI: process.env.MONGODB_URI ?? fallbackMongoUrl,
};

if (
  process.env.NODE_ENV === "production" &&
  process.env.BETTER_AUTH_SECRET === undefined
) {
  throw new Error("Set BETTER_AUTH_SECRET before running in production.");
}
