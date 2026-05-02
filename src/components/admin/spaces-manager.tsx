"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      <section className="rounded-2xl border bg-surface/40 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold">Новый раздел</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Быстрый старт"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="getting-started"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Описание</Label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="Что внутри."
            />
          </div>
          <div className="space-y-2">
            <Label>Эмодзи / иконка</Label>
            <Input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🚀"
              maxLength={4}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="gradient"
            onClick={createSpace}
            disabled={busy === "create"}
          >
            {busy === "create" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Создать
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Существующие разделы</h2>
        {spaces.length === 0 ? (
          <div className="tile p-10 text-center text-muted-foreground">
            Пока нет ни одного раздела.
          </div>
        ) : (
          spaces.map((s, idx) => (
            <div
              key={s.id}
              className="grid gap-3 rounded-2xl border bg-surface/40 p-5 backdrop-blur-sm md:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_auto]"
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveSpace(s)}
                  disabled={busy === s.id}
                >
                  {busy === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteSpace(s)}
                  disabled={busy === s.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
