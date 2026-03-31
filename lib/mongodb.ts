import type { Db, MongoClient } from "mongodb";
import mongoose from "mongoose";

import { env } from "@/lib/env";

declare global {
  var mongooseConn: { promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.mongooseConn ?? { promise: null };
if (process.env.NODE_ENV !== "production") {
  global.mongooseConn = cached;
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI);
  }
  await cached.promise;
  return mongoose;
}

function createLazyDb(): Db {
  return new Proxy({} as Db, {
    get(_target, prop) {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error(
          "MongoDB is not connected. Call connectDB() before using the database."
        );
      }
      const value = Reflect.get(db, prop, db);
      return typeof value === "function" ? value.bind(db) : value;
    },
  });
}

function createLazyMongoClient(): MongoClient {
  return new Proxy({} as MongoClient, {
    get(_target, prop) {
      const client = mongoose.connection.getClient();
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

/** Native `Db` for Better Auth; resolves after `connectDB()`. */
export const mongoDb = createLazyDb();

/** Native client for Better Auth transactions; resolves after `connectDB()`. */
export const mongoClient = createLazyMongoClient();
