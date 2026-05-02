"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

const labelClass =
  "font-mono text-2xs uppercase tracking-wider text-text-dimmer";

export function PageForm({ spaces, initial }: PageFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
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
        <div className="space-y-2">
          <Link
            href="/admin/pages"
            className="font-mono text-2xs uppercase tracking-wider text-text-dimmer hover:text-primary transition-colors"
          >
            ← Все страницы
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {initial ? "Редактирование" : "Новая страница"}
          </h1>
        </div>
        <div className="flex gap-2">
          {initial && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-dim hover:border-destructive/50 hover:text-destructive transition-colors"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Удалить
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-cta"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Сохранить
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Заголовок</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Как пользоваться API"
              className="h-11 font-display text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Краткое описание</Label>
            <Textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Появится в плитках и SEO-описании."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Контент</Label>
            <TipTapEditor
              initialContent={content}
              onChange={(json) => setContent(json)}
            />
          </div>
        </div>
        <aside className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
              Параметры
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Раздел</Label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface-2 px-3 text-[13px] text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:shadow-glow-sm"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="оставь пусто — сгенерируем"
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Эмодзи</Label>
              <Input
                value={emoji ?? ""}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="📘"
                maxLength={4}
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px]">
              <span>Опубликовано</span>
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
