"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { MenuBar } from "@/components/editor/menu-bar";

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  initialContent: unknown;
  onChange?: (json: unknown, text: string) => void;
}

export function TipTapEditor({ initialContent, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Typography,
      Placeholder.configure({
        placeholder: "Напиши что-нибудь полезное…",
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    onUpdate({ editor }) {
      onChange?.(editor.getJSON(), editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[60vh] max-w-none rounded-xl border border-border bg-surface p-6 focus:outline-none",
      },
    },
  });

  return (
    <div className="space-y-3">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
