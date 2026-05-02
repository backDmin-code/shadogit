import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Edit3 } from "lucide-react";
import { Breadcrumbs } from "@/components/docs/breadcrumbs";
import { ContentRenderer } from "@/components/docs/content-renderer";
import { TableOfContents } from "@/components/docs/toc";
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
    <>
      <article className="app-main min-w-0">
        <section className="page-hero">
          <div className="hero-orb1" />
          <div className="hero-orb2" />
          <div className="relative z-10">
            <div className="mb-5">
              <Breadcrumbs
                items={[
                  { label: "Документация", href: "/docs" },
                  {
                    label: page.space.title,
                    href: `/docs/${page.space.slug}`,
                  },
                  { label: page.title },
                ]}
              />
            </div>
            <div className="hero-eyebrow">{page.space.title}</div>
            <h1 className="page-title">
              {page.emoji ? (
                <span className="mr-3 align-middle">{page.emoji}</span>
              ) : null}
              {page.title}
            </h1>
            {page.description && (
              <p className="page-subtitle">{page.description}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="meta-chip">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(page.updatedAt)}</span>
              </span>
              {canEdit && (
                <Link
                  href={`/admin/pages/${page.id}`}
                  className="meta-chip hover:!border-primary/50 hover:!text-primary"
                >
                  <Edit3 className="h-3 w-3" /> Редактировать
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="content-wrapper px-6 md:px-14 py-10 max-w-[820px]">
          <ContentRenderer json={json} />

          {(prev || next) && (
            <nav className="doc-footer">
              {prev ? (
                <Link
                  href={`/docs/${page.space.slug}/${prev.slug}`}
                  className="footer-nav-link"
                >
                  <span className="direction">← Предыдущая</span>
                  <span className="page-name">{prev.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/docs/${page.space.slug}/${next.slug}`}
                  className="footer-nav-link next"
                >
                  <span className="direction">Следующая →</span>
                  <span className="page-name">{next.title}</span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </div>
      </article>
      <aside className="app-toc">
        <TableOfContents items={toc} />
      </aside>
    </>
  );
}
