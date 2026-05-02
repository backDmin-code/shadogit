"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MenuButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}

function MenuButton({ active, onClick, children, title, disabled }: MenuButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "!h-8 !w-8 !rounded-md text-text-dim hover:text-foreground hover:bg-surface-2",
        active &&
          "!bg-primary/10 !text-primary !border !border-primary/30"
      )}
    >
      {children}
    </Button>
  );
}

export function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const onLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  };

  const onImage = () => {
    const url = window.prompt("URL изображения");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="sticky top-[58px] z-10 flex flex-wrap items-center gap-1 rounded-md border border-border bg-surface/95 p-1.5 backdrop-blur-xl shadow-soft">
      <MenuButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="H1"
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="H2"
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="H3"
      >
        <Heading3 className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Жирный"
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Курсив"
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Зачёркнутый"
      >
        <Strikethrough className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline код"
      >
        <Code className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Выделение"
      >
        <Highlighter className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Маркированный список"
      >
        <List className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Нумерованный список"
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Чек-лист"
      >
        <ListChecks className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Цитата"
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Блок кода"
      >
        <Code2 className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton
        active={editor.isActive("link")}
        onClick={onLink}
        title="Ссылка"
      >
        <LinkIcon className="h-4 w-4" />
      </MenuButton>
      <MenuButton onClick={onImage} title="Изображение">
        <ImageIcon className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Разделитель"
      >
        <Minus className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Отменить"
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Повторить"
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </MenuButton>
    </div>
  );
}
