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
      className="header-search w-full max-w-[260px]"
    >
      <SearchIcon className="h-3 w-3" />
      <span className="hidden flex-1 truncate text-left sm:inline">
        Поиск по документации...
      </span>
      <kbd className="!ml-auto">⌘ K</kbd>
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
        className="left-1/2 top-[10vh] mx-auto h-auto w-[min(100%-2rem,640px)] -translate-x-1/2 rounded-xl border bg-surface p-0 shadow-glow-lg"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Поиск</SheetTitle>
        </SheetHeader>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <SearchIcon className="h-4 w-4 text-text-dim" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Найти страницу, заголовок или ключевое слово…"
            className="flex-1 border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0 focus-visible:shadow-none focus-visible:border-transparent h-auto"
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && query && !loading && (
            <div className="px-4 py-12 text-center text-sm text-text-dim">
              Ничего не нашлось по запросу{" "}
              <span className="text-foreground">«{query}»</span>
            </div>
          )}
          {results.length === 0 && !query && (
            <div className="px-4 py-12 text-center text-[13px] text-text-dim">
              Начни печатать, чтобы найти страницу.
              <div className="mt-4 flex items-center justify-center gap-1 text-2xs">
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                <span className="text-text-dimmer">навигация</span>
                <span className="mx-2 text-text-dimmer">·</span>
                <kbd>Enter</kbd>
                <span className="text-text-dimmer">открыть</span>
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
                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                active === i
                  ? "bg-primary/8 ring-1 ring-primary/30"
                  : "hover:bg-surface-2"
              )}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/12">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {r.title}
                  </span>
                  <span className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
                    {r.spaceTitle}
                  </span>
                </div>
                <p className="line-clamp-1 text-2xs text-text-dim">
                  {r.excerpt}
                </p>
              </div>
              {active === i && (
                <CornerDownLeft className="h-4 w-4 shrink-0 text-primary" />
              )}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
