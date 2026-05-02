import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional(),
  description: z.string().max(400).optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  order: z.number().int().optional(),
});

export async function GET() {
  const spaces = await prisma.space.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ spaces });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const slug = (data.slug && data.slug.trim()) || slugify(data.title);
  const space = await prisma.space.create({
    data: {
      title: data.title,
      slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      order: data.order ?? 0,
    },
  });
  return NextResponse.json({ space });
}
