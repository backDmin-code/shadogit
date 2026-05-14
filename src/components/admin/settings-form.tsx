"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
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

const labelClass =
  "font-mono text-2xs uppercase tracking-wider text-text-dimmer";

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
      <div className="grid gap-4 rounded-xl border border-border bg-surface p-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className={labelClass}>Название сайта</Label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Сквады"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Лого (эмодзи)</Label>
          <Input
            value={logoEmoji}
            onChange={(e) => setLogoEmoji(e.target.value)}
            placeholder="📘"
            maxLength={4}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className={labelClass}>Описание</Label>
          <Textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            rows={3}
            placeholder="Документация для проекта, которой захочется пользоваться."
          />
        </div>
      </div>
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
  );
}
