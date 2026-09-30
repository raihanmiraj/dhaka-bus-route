"use client";
import { useEffect, useRef, useId } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData, ToolConstructable } from "@editorjs/editorjs";
export default function EditorCanvas({
  initial,
  onReady,
  onChange,
}: {
  initial: OutputData;
  onReady: (editor: EditorJS) => void;
  onChange: () => void;
}) {
  const holder = useId().replaceAll(":", "");
  const callbacks = useRef({ onReady, onChange });
  callbacks.current = { onReady, onChange };
  const seed = useRef(initial);
  useEffect(() => {
    let cancelled = false;
    let editor: EditorJS | undefined;
    void (async () => {
      const [Core, Header, List, Quote, Image, Table, Delimiter] =
        await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/quote"),
          import("@editorjs/image"),
          import("@editorjs/table"),
          import("@editorjs/delimiter"),
        ]);
      if (cancelled) return;
      // Persist alt text in the actual image block alongside the Image Tool's own file and caption data.
      class AccessibleImage extends Image.default {
        private altInput?: HTMLInputElement;
        private initialAlt: string;
        constructor(args: ConstructorParameters<typeof Image.default>[0]) {
          super(args);
          this.initialAlt = (args.data as { alt?: string }).alt ?? "";
        }
        render() {
          const element = super.render();
          const label = document.createElement("label");
          label.textContent = "Image alternative text";
          this.altInput = document.createElement("input");
          this.altInput.value = this.initialAlt;
          this.altInput.placeholder = "Describe the image";
          this.altInput.addEventListener("input", () =>
            callbacks.current.onChange(),
          );
          label.append(this.altInput);
          element.append(label);
          return element;
        }
        save() {
          return {
            ...super.save(),
            alt: this.altInput?.value ?? this.initialAlt,
          };
        }
      }
      editor = new Core.default({
        holder,
        data: seed.current,
        placeholder: "Start writing your article…",
        tools: {
          header: {
            class: Header.default as unknown as ToolConstructable,
            config: { levels: [2, 3, 4], defaultLevel: 2 },
          },
          list: {
            class: List.default as unknown as ToolConstructable,
            inlineToolbar: true,
            config: { maxLevel: 5 },
          },
          quote: Quote.default as unknown as ToolConstructable,
          image: {
            class: AccessibleImage as unknown as ToolConstructable,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const f = new FormData();
                  f.set("image", file);
                  const r = await fetch("/api/upload", {
                    method: "POST",
                    body: f,
                  });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error);
                  setTimeout(() => callbacks.current.onChange(), 0);
                  return d;
                },
                async uploadByUrl() {
                  throw new Error(
                    "Remote image fetching is disabled. Upload a file.",
                  );
                },
              },
            },
          },
          table: Table.default as unknown as ToolConstructable,
          delimiter: Delimiter.default as unknown as ToolConstructable,
        },
        onChange: () => callbacks.current.onChange(),
      });
      await editor.isReady;
      if (cancelled) editor.destroy();
      else callbacks.current.onReady(editor);
    })().catch(() => {
      const el = document.getElementById(holder);
      if (el) el.textContent = "Editor could not load. Refresh to retry.";
    });
    return () => {
      cancelled = true;
      if (editor)
        void editor.isReady.then(() => editor?.destroy()).catch(() => {});
    };
  }, [holder]);
  return <div id={holder} className="editor-canvas" />;
}
