import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Edit3 } from "lucide-react";
import { Breadcrumbs } from "@/components/docs/breadcrumbs";
import { ContentRenderer } from "@/components/docs/content-renderer";
import { TableOfContents } from "@/components/docs/toc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPageBySlug } from "@/lib/data";
import { extractToc, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

interface Params {
  params: { space: string; slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params) {
  const page = await getPageBySlug(params.space, params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description ?? undefined,
  };
}

export default async function DocsPage({ params }: Params) {
  const page = await getPageBySlug(params.space, params.slug);
  if (!page) notFound();

  const json = (() => {
    try {
      return JSON.parse(page.contentJson);
    } catch {
      return null;
    }
  })();
  const toc = extractToc(json);

  // Prev/next inside the same space (flat order)
  const siblings = await prisma.page.findMany({
    where: { spaceId: page.spaceId, published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, title: true },
  });
  const idx = siblings.findIndex((s) => s.id === page.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const session = await getServerSession(authOptions);
  const canEdit = isAdmin(session?.user?.role);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
      <article className="min-w-0 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Документация", href: "/docs" },
            { label: page.space.title, href: `/docs/${page.space.slug}` },
            { label: page.title },
          ]}
        />
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="default">{page.space.title}</Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(page.updatedAt)}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {page.emoji ? (
              <span className="mr-3 align-middle">{page.emoji}</span>
            ) : null}
            {page.title}
          </h1>
          {page.description && (
            <p className="max-w-2xl text-lg text-muted-foreground">
              {page.description}
            </p>
          )}
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/admin/pages/${page.id}`}>
                <Edit3 className="h-4 w-4" /> Редактировать
              </Link>
            </Button>
          )}
        </header>

        <ContentRenderer json={json} />

        <nav className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/docs/${page.space.slug}/${prev.slug}`}
              className="tile flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Предыдущая
                  </div>
                  <div className="font-medium">{prev.title}</div>
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/docs/${page.space.slug}/${next.slug}`}
              className="tile flex items-center justify-between gap-3 p-4 text-right"
            >
              <div className="flex flex-1 items-center justify-end gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Следующая
                  </div>
                  <div className="font-medium">{next.title}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ) : null}
        </nav>
      </article>
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}
