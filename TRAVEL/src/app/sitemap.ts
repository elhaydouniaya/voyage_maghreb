import type { MetadataRoute } from "next";

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const now = new Date();
  const publicPaths = [
    "",
    "/voyages",
    "/recherche",
    "/login",
    "/register",
    "/agency/login",
    "/agency/register",
    "/legal/mentions",
    "/legal/confidentialite",
    "/legal/cgu",
    "/legal/remboursements",
  ];

  return publicPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/voyages" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/recherche" ? 0.9 : 0.7,
  }));
}
