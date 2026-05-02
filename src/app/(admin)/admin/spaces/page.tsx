import { SpacesManager } from "@/components/admin/spaces-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSpacesPage() {
  const spaces = await prisma.space.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="hero-eyebrow !mb-0">Структура</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Разделы
        </h1>
        <p className="text-[13px] text-text-dim">
          Группируй документацию по логическим пространствам.
        </p>
      </header>
      <SpacesManager initial={spaces} />
    </div>
  );
}
