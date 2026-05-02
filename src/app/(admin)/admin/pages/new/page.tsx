import { redirect } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  const spaces = await prisma.space.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  if (spaces.length === 0) {
    redirect("/admin/spaces?need=true");
  }
  return <PageForm spaces={spaces.map((s) => ({ id: s.id, title: s.title }))} />;
}
