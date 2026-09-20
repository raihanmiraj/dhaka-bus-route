"use client";
import { forwardRef, useId, useState, type ReactNode } from "react";
export const Dialog = forwardRef<
  HTMLDialogElement,
  { title: string; children: ReactNode }
>(function Dialog({ title, children }, ref) {
  const id = useId();
  return (
    <dialog ref={ref} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
});
export function Tabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map((t, i) => (
          <button
            type="button"
            key={t.label}
            id={`${id}-tab-${i}`}
            role="tab"
            aria-selected={selected === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={selected === i ? 0 : -1}
            onClick={() => setSelected(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % tabs.length
                  : e.key === "ArrowLeft"
                    ? (i + tabs.length - 1) % tabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                setSelected(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <section
          key={t.label}
          id={`${id}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${i}`}
          hidden={selected !== i}
          tabIndex={0}
        >
          {t.content}
        </section>
      ))}
    </div>
  );
}
