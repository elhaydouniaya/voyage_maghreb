import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const publicPaths: MetadataRoute.Sitemap = [
    "",
    "/voyages",
    "/recherche",
    "/destinations",
    "/about",
    "/reviews",
    "/login",
    "/register",
    "/agency/login",
    "/agency/register",
    "/legal/mentions",
    "/legal/confidentialite",
    "/legal/cgu",
    "/legal/remboursements",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/voyages" ? ("daily" as const) : ("weekly" as const),
    priority: path === "" ? 1 : path === "/recherche" ? 0.9 : 0.7,
  }));

  let tripEntries: MetadataRoute.Sitemap = [];
  try {
    const trips = await prisma.groupTrip.findMany({
      where: {
        status: { in: ["PUBLISHED", "FULL"] },
        isPublic: true,
      },
      select: { slug: true, updatedAt: true },
      orderBy: { startDate: "asc" },
      take: 500,
    });

    tripEntries = trips.map((t) => ({
      url: `${base}/trip/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    /* DB unavailable at build time — static paths only */
  }

  return [...publicPaths, ...tripEntries];
}
