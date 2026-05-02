import * as React from "react";
import { slugify } from "@/lib/utils";

type Mark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: Mark[];
};

function renderMarks(
  text: string,
  marks: Mark[] | undefined,
  key: string | number
): React.ReactNode {
  let node: React.ReactNode = text;
  if (!marks?.length) return <React.Fragment key={key}>{node}</React.Fragment>;
  marks.forEach((m, i) => {
    const k = `${key}-mark-${i}`;
    switch (m.type) {
      case "bold":
        node = <strong key={k}>{node}</strong>;
        break;
      case "italic":
        node = <em key={k}>{node}</em>;
        break;
      case "underline":
        node = <u key={k}>{node}</u>;
        break;
      case "strike":
        node = <s key={k}>{node}</s>;
        break;
      case "code":
        node = <code key={k}>{node}</code>;
        break;
      case "highlight":
        node = <mark key={k}>{node}</mark>;
        break;
      case "link": {
        const href = (m.attrs?.href as string) ?? "#";
        const target = m.attrs?.target as string | undefined;
        node = (
          <a
            key={k}
            href={href}
            target={target}
            rel={target === "_blank" ? "noopener noreferrer" : undefined}
          >
            {node}
          </a>
        );
        break;
      }
    }
  });
  return <React.Fragment key={key}>{node}</React.Fragment>;
}

function plainTextOf(node: TipTapNode | undefined): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content))
    return node.content.map(plainTextOf).join("");
  return "";
}

function renderChildren(
  nodes: TipTapNode[] | undefined,
  parentKey: string | number
): React.ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => renderNode(n, `${parentKey}-${i}`));
}

function renderNode(node: TipTapNode, key: string | number): React.ReactNode {
  if (node.type === "text") {
    return renderMarks(node.text ?? "", node.marks, key);
  }

  switch (node.type) {
    case "doc":
      return <React.Fragment key={key}>{renderChildren(node.content, key)}</React.Fragment>;
    case "paragraph":
      return <p key={key}>{renderChildren(node.content, key)}</p>;
    case "heading": {
      const level = Math.min(
        Math.max(((node.attrs?.level as number) ?? 2) | 0, 1),
        6
      );
      const text = plainTextOf(node).trim();
      const id = slugify(text) || `heading-${key}`;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <Tag key={key} id={id}>
          {renderChildren(node.content, key)}
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content, key)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node.content, key)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node.content, key)}</li>;
    case "taskList":
      return (
        <ul key={key} data-type="taskList">
          {renderChildren(node.content, key)}
        </ul>
      );
    case "taskItem":
      return (
        <li key={key} data-type="taskItem" data-checked={!!node.attrs?.checked}>
          <label>
            <input
              type="checkbox"
              defaultChecked={!!node.attrs?.checked}
              disabled
            />
          </label>
          <div>{renderChildren(node.content, key)}</div>
        </li>
      );
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content, key)}</blockquote>;
    case "codeBlock": {
      const lang = (node.attrs?.language as string) || "plaintext";
      return (
        <pre key={key} data-language={lang}>
          <code className={`language-${lang}`}>
            {renderChildren(node.content, key)}
          </code>
        </pre>
      );
    }
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = (node.attrs?.src as string) ?? "";
      const alt = (node.attrs?.alt as string) ?? "";
      const title = (node.attrs?.title as string) ?? undefined;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} title={title} />;
    }
    default:
      // Fall back: render children if any
      return (
        <React.Fragment key={key}>
          {renderChildren(node.content, key)}
        </React.Fragment>
      );
  }
}

export function ContentRenderer({ json }: { json: unknown }) {
  if (!json || typeof json !== "object") {
    return (
      <p className="text-muted-foreground">Эта страница пока пустая.</p>
    );
  }
  return (
    <article className="tiptap-content">
      {renderNode(json as TipTapNode, "root")}
    </article>
  );
}
