"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search as SearchIcon,
  CornerDownLeft,
  Hash,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  spaceTitle: string;
}

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(
  null
);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx)
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteTrigger() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(true)}
      className="group flex h-9 w-full max-w-xs items-center gap-2 rounded-xl border bg-surface/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface/80 hover:text-foreground"
    >
      <SearchIcon className="h-4 w-4" />
      <span className="hidden flex-1 text-left sm:inline">Поиск по докам…</span>
      <span className="hidden items-center gap-1 sm:inline-flex">
        <kbd className="rounded-md border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </span>
    </button>
  );
}

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = (await res.json()) as { results: SearchResult[] };
        if (!cancelled) {
          setResults(json.results ?? []);
          setActive(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = results[active];
      if (r) {
        onOpenChange(false);
        router.push(r.href);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="left-1/2 top-[10vh] mx-auto h-auto w-[min(100%-2rem,640px)] -translate-x-1/2 rounded-3xl border p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Поиск</SheetTitle>
        </SheetHeader>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Найти страницу, заголовок или ключевое слово…"
            className="flex-1 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && query && !loading && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Ничего не нашлось по запросу{" "}
              <span className="text-foreground">«{query}»</span>
            </div>
          )}
          {results.length === 0 && !query && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Начни печатать, чтобы найти страницу.
              <div className="mt-3 flex items-center justify-center gap-1 text-xs">
                <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono">
                  ↑
                </kbd>
                <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono">
                  ↓
                </kbd>
                <span>навигация</span>
                <span className="mx-2">·</span>
                <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono">
                  Enter
                </kbd>
                <span>открыть</span>
              </div>
            </div>
          )}
          {results.map((r, i) => (
            <Link
              key={r.id}
              href={r.href}
              onClick={() => onOpenChange(false)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                active === i ? "bg-secondary" : "hover:bg-secondary/60"
              )}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,rgba(124,92,255,0.25)_0%,rgba(34,211,238,0.20)_100%)]">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{r.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.spaceTitle}
                  </span>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {r.excerpt}
                </p>
              </div>
              {active === i && (
                <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
