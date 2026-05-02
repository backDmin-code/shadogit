import { SpacesManager } from "@/components/admin/spaces-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSpacesPage() {
  const spaces = await prisma.space.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Разделы</h1>
        <p className="text-sm text-muted-foreground">
          Группируй документацию по логическим пространствам.
        </p>
      </header>
      <SpacesManager initial={spaces} />
    </div>
  );
}
