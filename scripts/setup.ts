import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { setupIndexes } = await import("../lib/indexes");
const { db, client } = await import("../lib/db");
if (!process.argv.includes("--apply")) {
  console.log(
    "Dry run: creates unique, publication, taxonomy, session, abuse and revision indexes. Optionally seeds two noindex taxonomy examples. No writes performed. Run with --apply against your intended database after taking a backup.",
  );
  process.exit(0);
}
await setupIndexes();
if (process.argv.includes("--seed")) {
  const d = await db();
  for (const [kind, name, slug] of [
    ["categories", "Using this website", "using-this-website"],
    ["tags", "Journey planning", "journey-planning"],
  ])
    await d.collection(kind).updateOne(
      { slug },
      {
        $setOnInsert: {
          name,
          slug,
          description: "",
          seoTitle: "",
          seoDescription: "",
          locale: "en",
          indexable: false,
          modifiedAt: new Date(),
        },
      },
      { upsert: true },
    );
}
console.log("Indexes ready. No articles were published.");
await (await client()).close();
