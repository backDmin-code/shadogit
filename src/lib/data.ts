import { prisma } from "@/lib/prisma";
import type { SidebarSpace, SidebarPage } from "@/components/docs/sidebar-nav";

export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });
  if (existing) return existing;
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function getSidebarTree(): Promise<SidebarSpace[]> {
  const spaces = await prisma.space.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      pages: {
        where: { published: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return spaces.map((space) => {
    const byParent = new Map<string | null, typeof space.pages>();
    for (const p of space.pages) {
      const arr = byParent.get(p.parentId) ?? [];
      arr.push(p);
      byParent.set(p.parentId, arr);
    }
    function build(parentId: string | null): SidebarPage[] {
      const list = byParent.get(parentId) ?? [];
      return list.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        emoji: p.emoji,
        children: build(p.id),
      }));
    }
    return {
      id: space.id,
      slug: space.slug,
      title: space.title,
      icon: space.icon,
      pages: build(null),
    };
  });
}

export async function getPageBySlug(spaceSlug: string, pageSlug: string) {
  const space = await prisma.space.findUnique({ where: { slug: spaceSlug } });
  if (!space) return null;
  const page = await prisma.page.findFirst({
    where: { spaceId: space.id, slug: pageSlug, published: true },
    include: { space: true },
  });
  return page;
}

export async function getRecentPages(limit = 6) {
  return prisma.page.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { space: true },
  });
}
