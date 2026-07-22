import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/et98/", "/profile/settings/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}