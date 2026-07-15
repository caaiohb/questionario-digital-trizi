import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/questionario", "/politica-de-privacidade"], disallow: ["/painel", "/login", "/api"] },
    ],
  };
}
