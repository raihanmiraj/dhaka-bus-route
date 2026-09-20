import "server-only";
import { revalidatePath } from "next/cache";
// Mongo-backed public reads are force-dynamic: no shared data cache. Expire router artifacts explicitly.
export function invalidatePublic() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}
