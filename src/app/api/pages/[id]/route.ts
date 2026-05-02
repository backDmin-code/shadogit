import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractText, slugify } from "@/lib/utils";

const updateSchema = z.object({
  spaceId: z.string().min(1).optional(),
  title: z.string().min(1).max(180).optional(),
  description: z.string().max(400).optional().nullable(),
  emoji: z.string().max(8).optional().nullable(),
  slug: z.string().optional().nullable(),
  parentId: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  published: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const page = await prisma.page.findUnique({
    where: { id: params.id },
    include: { space: true },
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const slug =
    data.slug !== undefined && data.slug !== null && data.slug !== ""
      ? slugify(data.slug)
      : data.title
        ? slugify(data.title)
        : undefined;

  const updated = await prisma.page.update({
    where: { id: params.id },
    data: {
      ...(data.spaceId ? { spaceId: data.spaceId } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.emoji !== undefined ? { emoji: data.emoji } : {}),
      ...(slug ? { slug } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.contentJson !== undefined
        ? {
            contentJson: JSON.stringify(data.contentJson),
            contentText: extractText(data.contentJson),
          }
        : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.contentJson !== undefined
        ? {
            revisions: {
              create: {
                title: data.title ?? "Update",
                contentJson: JSON.stringify(data.contentJson),
                authorId: session.user.id,
              },
            },
          }
        : {}),
    },
  });
  return NextResponse.json({ page: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.page.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
