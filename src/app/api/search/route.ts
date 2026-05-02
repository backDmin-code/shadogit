import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (!tokens.length) return NextResponse.json({ results: [] });

  // SQLite has no FTS by default in our schema, so do a LIKE-based contains
  // search on title + plain text. Cheap and good enough for v1.
  const pages = await prisma.page.findMany({
    where: {
      published: true,
      AND: tokens.map((t) => ({
        OR: [
          { title: { contains: t } },
          { contentText: { contains: t } },
          { description: { contains: t } },
        ],
      })),
    },
    include: { space: true },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  const results = pages.map((p) => {
    const text = (p.contentText ?? "").trim();
    const lower = text.toLowerCase();
    const idx = lower.indexOf(tokens[0]);
    const start = Math.max(0, idx - 50);
    const excerpt =
      idx >= 0
        ? (start > 0 ? "…" : "") +
          text.slice(start, idx + tokens[0].length + 100) +
          (text.length > idx + tokens[0].length + 100 ? "…" : "")
        : text.slice(0, 140) + (text.length > 140 ? "…" : "");
    return {
      id: p.id,
      title: p.title,
      excerpt,
      href: `/docs/${p.space.slug}/${p.slug}`,
      spaceTitle: p.space.title,
    };
  });

  return NextResponse.json({ results });
}
