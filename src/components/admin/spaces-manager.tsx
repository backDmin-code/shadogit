"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const labelClass =
  "font-mono text-2xs uppercase tracking-wider text-text-dimmer";

interface Space {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
}

export function SpacesManager({ initial }: { initial: Space[] }) {
  const router = useRouter();
  const [spaces, setSpaces] = React.useState<Space[]>(initial);
  const [busy, setBusy] = React.useState<string | null>(null);

  // New space form
  const [newTitle, setNewTitle] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newIcon, setNewIcon] = React.useState("");

  async function createSpace() {
    if (!newTitle.trim()) {
      toast.error("Заполни название");
      return;
    }
    setBusy("create");
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || undefined,
          description: newDescription || null,
          icon: newIcon || null,
          order: spaces.length,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Ошибка создания", { description: json.error });
        return;
      }
      toast.success("Раздел создан");
      setSpaces((s) => [...s, json.space]);
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewIcon("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function saveSpace(s: Space) {
    setBusy(s.id);
    try {
      const res = await fetch(`/api/spaces/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          slug: s.slug,
          description: s.description,
          icon: s.icon,
          order: s.order,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Ошибка", { description: json.error });
        return;
      }
      toast.success("Сохранено");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteSpace(s: Space) {
    if (
      !window.confirm(
        `Удалить раздел «${s.title}»? Все страницы внутри тоже удалятся.`
      )
    )
      return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/spaces/${s.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error("Ошибка", { description: json.error });
        return;
      }
      toast.success("Удалено");
      setSpaces((arr) => arr.filter((x) => x.id !== s.id));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <div className="eyebrow mb-2">Новый</div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Раздел
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelClass}>Название</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Быстрый старт"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Slug</Label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="getting-started"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className={labelClass}>Описание</Label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="Что внутри."
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Эмодзи / иконка</Label>
            <Input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🚀"
              maxLength={4}
            />
          </div>
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={createSpace}
            disabled={busy === "create"}
            className="btn-cta"
          >
            {busy === "create" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Создать
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="eyebrow mb-2">Список</div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Существующие разделы
          </h2>
        </div>
        {spaces.length === 0 ? (
          <div className="tile p-10 text-center text-text-dim text-[13px]">
            Пока нет ни одного раздела.
          </div>
        ) : (
          spaces.map((s, idx) => (
            <div
              key={s.id}
              className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <Input
                className="text-center text-xl"
                maxLength={4}
                value={s.icon ?? ""}
                onChange={(e) =>
                  setSpaces((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, icon: e.target.value } : x
                    )
                  )
                }
              />
              <Input
                value={s.title}
                onChange={(e) =>
                  setSpaces((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, title: e.target.value } : x
                    )
                  )
                }
              />
              <Input
                value={s.slug}
                onChange={(e) =>
                  setSpaces((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, slug: e.target.value } : x
                    )
                  )
                }
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveSpace(s)}
                  disabled={busy === s.id}
                  aria-label="Сохранить"
                  className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface-2 text-text-dim hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {busy === s.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSpace(s)}
                  disabled={busy === s.id}
                  aria-label="Удалить"
                  className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface-2 text-text-dim hover:border-destructive/50 hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
