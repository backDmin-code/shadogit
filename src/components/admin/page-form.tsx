"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import Link from "next/link";

interface SpaceOption {
  id: string;
  title: string;
}

interface PageFormProps {
  spaces: SpaceOption[];
  initial?: {
    id: string;
    title: string;
    description?: string | null;
    emoji?: string | null;
    slug: string;
    spaceId: string;
    contentJson: unknown;
    published: boolean;
  };
  onSaved?: () => void;
}

export function PageForm({ spaces, initial }: PageFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [emoji, setEmoji] = React.useState(initial?.emoji ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [spaceId, setSpaceId] = React.useState(
    initial?.spaceId ?? spaces[0]?.id ?? ""
  );
  const [published, setPublished] = React.useState(initial?.published ?? true);
  const [content, setContent] = React.useState<unknown>(
    initial?.contentJson ?? { type: "doc", content: [{ type: "paragraph" }] }
  );
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function onSave() {
    if (!title.trim()) {
      toast.error("Заполни заголовок");
      return;
    }
    if (!spaceId) {
      toast.error("Выбери раздел");
      return;
    }
    setSaving(true);
    try {
      const url = initial ? `/api/pages/${initial.id}` : "/api/pages";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          emoji: emoji || null,
          slug: slug || null,
          spaceId,
          contentJson: content,
          published,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Ошибка сохранения", { description: json.error });
        return;
      }
      toast.success("Сохранено");
      if (!initial && json.page?.id) {
        router.push(`/admin/pages/${json.page.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Точно удалить эту страницу?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pages/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error("Ошибка удаления", { description: json.error });
        return;
      }
      toast.success("Удалено");
      router.push("/admin/pages");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/pages" className="hover:text-foreground">
              ← Все страницы
            </Link>
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {initial ? "Редактирование" : "Новая страница"}
          </h1>
        </div>
        <div className="flex gap-2">
          {initial && (
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={deleting}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Удалить
            </Button>
          )}
          <Button variant="gradient" onClick={onSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Сохранить
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Как пользоваться API"
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Краткое описание</Label>
            <Textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Появится в плитках и SEO-описании."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Контент</Label>
            <TipTapEditor
              initialContent={content}
              onChange={(json) => setContent(json)}
            />
          </div>
        </div>
        <aside className="space-y-4">
          <div className="space-y-2 rounded-2xl border bg-surface/40 p-4 backdrop-blur-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Параметры
            </div>
            <div className="space-y-2">
              <Label>Раздел</Label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="flex h-10 w-full rounded-xl border bg-surface/60 px-3 text-sm ring-offset-background backdrop-blur-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="оставь пусто — сгенерируем"
              />
            </div>
            <div className="space-y-2">
              <Label>Эмодзи</Label>
              <Input
                value={emoji ?? ""}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="📘"
                maxLength={4}
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3">
              <span className="text-sm">Опубликовано</span>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
