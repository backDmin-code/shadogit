import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: Params) {
  const [page, spaces] = await Promise.all([
    prisma.page.findUnique({ where: { id: params.id } }),
    prisma.space.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  if (!page) notFound();
  let json: unknown = { type: "doc", content: [{ type: "paragraph" }] };
  try {
    json = JSON.parse(page.contentJson);
  } catch {
    /* ignore */
  }
  return (
    <PageForm
      spaces={spaces.map((s) => ({ id: s.id, title: s.title }))}
      initial={{
        id: page.id,
        title: page.title,
        description: page.description,
        emoji: page.emoji,
        slug: page.slug,
        spaceId: page.spaceId,
        published: page.published,
        contentJson: json,
      }}
    />
  );
}
