import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  slug: z.string().optional(),
  description: z.string().max(400).optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  order: z.number().int().optional(),
});

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
  const updated = await prisma.space.update({
    where: { id: params.id },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.slug
        ? { slug: slugify(data.slug) }
        : data.title
          ? { slug: slugify(data.title) }
          : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });
  return NextResponse.json({ space: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.space.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
