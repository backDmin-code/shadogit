import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageTile } from "@/components/docs/page-tile";
import { Breadcrumbs } from "@/components/docs/breadcrumbs";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { space: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params) {
  const space = await prisma.space.findUnique({
    where: { slug: params.space },
  });
  if (!space) return {};
  return { title: space.title, description: space.description ?? undefined };
}

export default async function SpacePage({ params }: Params) {
  const space = await prisma.space.findUnique({
    where: { slug: params.space },
    include: {
      pages: {
        where: { published: true, parentId: null },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!space) notFound();
  return (
    <main className="app-main app-main--no-toc">
      <section className="page-hero">
        <div className="hero-orb1" />
        <div className="relative z-10">
          <div className="mb-5">
            <Breadcrumbs
              items={[
                { label: "Документация", href: "/docs" },
                { label: space.title },
              ]}
            />
          </div>
          <div className="hero-eyebrow flex items-center gap-2">
            {space.icon ? <span>{space.icon}</span> : null}
            <span>{space.title}</span>
          </div>
          <h1 className="page-title">{space.title}</h1>
          {space.description && (
            <p className="page-subtitle">{space.description}</p>
          )}
          <div className="mt-6">
            <Badge variant="default">{space.pages.length} страниц</Badge>
          </div>
        </div>
      </section>

      <div className="px-6 md:px-14 py-10 max-w-5xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {space.pages.length === 0 ? (
            <div className="tile col-span-full p-10 text-center text-text-dim">
              В этом разделе пока нет страниц.
            </div>
          ) : (
            space.pages.map((p) => (
              <PageTile
                key={p.id}
                href={`/docs/${space.slug}/${p.slug}`}
                title={p.title}
                description={p.description ?? undefined}
                emoji={p.emoji ?? "📄"}
              />
            ))
          )}
        </div>
        <div className="mt-8 font-mono text-2xs uppercase tracking-wider text-text-dimmer">
          <Link className="hover:text-primary transition-colors" href="/docs">
            ← Все разделы
          </Link>
        </div>
      </div>
    </main>
  );
}
