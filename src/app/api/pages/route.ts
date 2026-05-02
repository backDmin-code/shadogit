import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractText, slugify } from "@/lib/utils";

const upsertSchema = z.object({
  spaceId: z.string().min(1),
  title: z.string().min(1).max(180),
  description: z.string().max(400).optional().nullable(),
  emoji: z.string().max(8).optional().nullable(),
  slug: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  contentJson: z.unknown(),
  published: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function GET() {
  const pages = await prisma.page.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { space: true },
  });
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const slug = (data.slug && data.slug.trim()) || slugify(data.title);
  const contentText = extractText(data.contentJson);

  try {
    const page = await prisma.page.create({
      data: {
        spaceId: data.spaceId,
        title: data.title,
        description: data.description ?? null,
        emoji: data.emoji ?? null,
        slug,
        parentId: data.parentId ?? null,
        contentJson: JSON.stringify(data.contentJson ?? { type: "doc" }),
        contentText,
        published: data.published ?? true,
        order: data.order ?? 0,
        authorId: session.user.id,
        revisions: {
          create: {
            title: data.title,
            contentJson: JSON.stringify(data.contentJson ?? { type: "doc" }),
            authorId: session.user.id,
          },
        },
      },
    });
    return NextResponse.json({ page });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
