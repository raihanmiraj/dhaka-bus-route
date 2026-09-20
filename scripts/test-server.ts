// Explicit local-only harness. Never reads .env.local or production credentials.
import { spawn, execFileSync } from "node:child_process";
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword } from "better-auth/crypto";
import { randomBytes } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
const databaseName = `dhaka_test_browser_${process.pid}`;
const uri = "mongodb://127.0.0.1:27028/?replicaSet=dhakaTest";
const secret = randomBytes(48).toString("base64url");
const password = randomBytes(24).toString("base64url");
process.env.MONGODB_URI = uri;
process.env.MONGODB_DB = databaseName;
process.env.AUTH_SECRET = secret;
process.env.SITE_URL = "http://localhost:3018";
const c = await MongoClient.connect(uri);
const d = c.db(databaseName);
const id = new ObjectId(),
  now = new Date();
await d.collection("user").insertOne({
  _id: id,
  email: "fixture@example.test",
  name: "Test author",
  role: "admin",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
});
await d.collection("account").insertOne({
  _id: new ObjectId(),
  userId: id,
  accountId: id.toHexString(),
  providerId: "credential",
  password: await hashPassword(password),
  createdAt: now,
  updatedAt: now,
});
await d.collection("authors").insertOne({
  _id: new ObjectId(),
  userId: id.toHexString(),
  name: "Test author",
  slug: "test-author",
  bio: "Isolated test fixture",
  locale: "en",
});
await writeFile(
  "/private/tmp/dhaka-browser-fixture.json",
  JSON.stringify({ email: "fixture@example.test", password, databaseName }),
  { mode: 0o600 },
);
execFileSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "tsx",
    "scripts/setup.ts",
    "--apply",
  ],
  { env: process.env, stdio: "inherit" },
);
const child = spawn(
  "npm",
  [
    "run",
    process.argv.includes("--production") ? "start" : "dev",
    "--",
    "--port",
    "3018",
  ],
  { stdio: "inherit", env: process.env },
);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  child.kill("SIGTERM");
  await d.dropDatabase();
  await c.close();
  await unlink("/private/tmp/dhaka-browser-fixture.json").catch(() => {});
  process.exit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
