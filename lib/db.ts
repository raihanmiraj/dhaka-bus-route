import "server-only";
import { MongoClient } from "mongodb";
import { databaseConfig } from "./config";
const globalDb = globalThis as typeof globalThis & {
  mongoPromise?: Promise<MongoClient>;
};
export async function client() {
  if (!globalDb.mongoPromise) {
    const c = new MongoClient(databaseConfig().MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalDb.mongoPromise = c.connect().catch(async () => {
      globalDb.mongoPromise = undefined;
      await c.close();
      throw new Error(
        "Database unavailable. Check connection and Atlas network access.",
      );
    });
  }
  return globalDb.mongoPromise;
}
export async function db() {
  return (await client()).db(databaseConfig().MONGODB_DB);
}
