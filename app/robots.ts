import { siteUrl } from "@/lib/config";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
