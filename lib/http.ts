import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";
export function failure(e: unknown) {
  if (e instanceof HttpError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError)
    return NextResponse.json(
      {
        error: e.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (e && typeof e === "object" && "code" in e && e.code === 11000)
    return NextResponse.json(
      { error: "That slug or unique value is already in use." },
      { status: 409 },
    );
  console.error(
    "Request failed:",
    e instanceof Error ? e.name : "UnknownError",
  );
  return NextResponse.json(
    { error: "Service unavailable. Check database setup and try again." },
    { status: 503 },
  );
}
export async function boundedBody(req: Request, max: number) {
  if (Number(req.headers.get("content-length") ?? 0) > max)
    throw new HttpError(413, "Request too large");
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw new HttpError(413, "Request too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function json(req: Request) {
  const text = new TextDecoder().decode(await boundedBody(req, 600000));
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
  const pending = [{ value, depth: 0 }];
  while (pending.length) {
    const item = pending.pop()!;
    if (item.depth > 25)
      throw new HttpError(400, "Content nesting is too deep");
    if (item.value && typeof item.value === "object")
      for (const value of Object.values(item.value))
        pending.push({ value, depth: item.depth + 1 });
  }
  return value;
}
