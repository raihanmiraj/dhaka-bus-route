import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { createInterface } from "node:readline/promises";
import { ObjectId } from "mongodb";
import { hashPassword } from "better-auth/crypto";
loadEnvConfig(process.cwd());
const { db, client } = await import("../lib/db");
const { setupIndexes } = await import("../lib/indexes");
if (!process.stdin.isTTY)
  throw new Error(
    "Run in an interactive terminal. Passwords must not be passed on the command line.",
  );
const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = (await rl.question("Email: ")).trim().toLowerCase();
const name = (await rl.question("Real author name: ")).trim();
const slug = (
  await rl.question("Author slug (lowercase words with hyphens): ")
).trim();
const role = process.argv.includes("--editor") ? "editor" : "admin";
rl.close();
async function hidden(prompt: string) {
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const done = () => {
      process.stdin.off("data", read);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const read = (buffer: Buffer) => {
      for (const ch of buffer.toString()) {
        if (ch === "\u0003") {
          done();
          reject(new Error("Cancelled"));
          return;
        }
        if (ch === "\r" || ch === "\n") {
          done();
          resolve(value);
          return;
        }
        if (ch === "\u007f") value = value.slice(0, -1);
        else value += ch;
      }
    };
    process.stdin.on("data", read);
  });
}
const password = await hidden("Password (hidden; 14–128 characters): ");
const confirm = await hidden("Confirm password: ");
if (password !== confirm || password.length < 14 || password.length > 128)
  throw new Error("Password mismatch or invalid length.");
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !name ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
)
  throw new Error("Invalid account details.");
await setupIndexes();
const database = await db(),
  session = (await client()).startSession();
try {
  await session.withTransaction(async () => {
    const existing = await database
      .collection("user")
      .findOne({ email }, { session });
    if (existing && !process.argv.includes("--reset-password"))
      throw new Error(
        "Account exists. Use --reset-password for owner-assisted recovery.",
      );
    const now = new Date(),
      id = existing?._id ?? new ObjectId();
    if (existing) {
      await database
        .collection("account")
        .updateOne(
          { userId: id, providerId: "credential" },
          { $set: { password: await hashPassword(password), updatedAt: now } },
          { session },
        );
      await database
        .collection("session")
        .deleteMany({ userId: id }, { session });
    } else {
      await database.collection("user").insertOne(
        {
          _id: id,
          name,
          email,
          emailVerified: true,
          role,
          createdAt: now,
          updatedAt: now,
        },
        { session },
      );
      await database.collection("account").insertOne(
        {
          _id: new ObjectId(),
          userId: id,
          accountId: id.toHexString(),
          providerId: "credential",
          password: await hashPassword(password),
          createdAt: now,
          updatedAt: now,
        },
        { session },
      );
      await database.collection("authors").insertOne(
        {
          _id: new ObjectId(),
          userId: id.toHexString(),
          name,
          slug,
          bio: "",
          locale: "en",
        },
        { session },
      );
    }
  });
  console.log(
    "Account saved. Existing sessions were revoked on password reset.",
  );
} finally {
  await session.endSession();
  await (await client()).close();
}
