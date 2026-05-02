import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Walk a TipTap JSON document and extract a plain-text representation
 * (used for full-text search indexing and excerpts).
 */
export function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) {
    return (n.content as unknown[]).map((c) => extractText(c)).join(" ");
  }
  return "";
}

/**
 * Walk a TipTap JSON document and extract heading nodes for a TOC.
 * Returns flat list with id, text, level (1-6).
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}
export function extractToc(node: unknown): TocItem[] {
  const items: TocItem[] = [];
  function walk(n: unknown) {
    if (!n || typeof n !== "object") return;
    const node = n as Record<string, unknown>;
    if (node.type === "heading") {
      const text = extractText(node).trim();
      const level = ((node.attrs as Record<string, number>)?.level as number) || 2;
      const id = slugify(text) || `heading-${items.length}`;
      items.push({ id, text, level });
    }
    if (Array.isArray(node.content)) {
      (node.content as unknown[]).forEach(walk);
    }
  }
  walk(node);
  return items;
}
