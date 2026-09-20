import { throttle } from "@/lib/abuse";
import { auth } from "@/lib/auth";
import { failure } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(req: Request) {
  try {
    if (
      req.method === "POST" &&
      new URL(req.url).pathname.endsWith("/sign-in/email")
    )
      await throttle(req, "login", 30);
    return await (await auth()).handler(req);
  } catch (e) {
    return failure(e);
  }
}
export { handle as GET, handle as POST };
