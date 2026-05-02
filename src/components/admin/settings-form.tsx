"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  initial: {
    siteName: string;
    siteDescription: string;
    logoEmoji: string;
  };
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter();
  const [siteName, setSiteName] = React.useState(initial.siteName);
  const [siteDescription, setSiteDescription] = React.useState(
    initial.siteDescription
  );
  const [logoEmoji, setLogoEmoji] = React.useState(initial.logoEmoji);
  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName, siteDescription, logoEmoji }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Ошибка", { description: json.error });
        return;
      }
      toast.success("Сохранено");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border bg-surface/40 p-6 backdrop-blur-sm md:grid-cols-2">
        <div className="space-y-2">
          <Label>Название сайта</Label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Shadogit Docs"
          />
        </div>
        <div className="space-y-2">
          <Label>Лого (эмодзи)</Label>
          <Input
            value={logoEmoji}
            onChange={(e) => setLogoEmoji(e.target.value)}
            placeholder="📘"
            maxLength={4}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Описание</Label>
          <Textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            rows={3}
            placeholder="Документация для проекта, которой захочется пользоваться."
          />
        </div>
      </div>
      <Button onClick={onSave} variant="gradient" disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Сохранить
      </Button>
    </div>
  );
}
