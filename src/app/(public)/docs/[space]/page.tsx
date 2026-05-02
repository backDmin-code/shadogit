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
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Документация", href: "/docs" },
          { label: space.title },
        ]}
      />
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          {space.icon ? <span className="text-3xl">{space.icon}</span> : null}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {space.title}
          </h1>
        </div>
        {space.description && (
          <p className="max-w-2xl text-muted-foreground">{space.description}</p>
        )}
        <Badge variant="secondary">{space.pages.length} страниц</Badge>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {space.pages.length === 0 ? (
          <div className="tile col-span-full p-10 text-center text-muted-foreground">
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
      <div className="text-sm text-muted-foreground">
        <Link className="hover:text-foreground" href="/docs">
          ← Все разделы
        </Link>
      </div>
    </div>
  );
}
