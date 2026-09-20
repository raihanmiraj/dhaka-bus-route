"use client";
import { useState } from "react";
import { Button, Alert } from "./ui";
import { track } from "./search";
export function CorrectionForm({
  routes,
  selected,
}: {
  routes: { id: number; name: string }[];
  selected: string;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        try {
          const r = await fetch("/api/corrections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setMessage(
            "Thank you. Your correction is saved for editorial review.",
          );
          track("correction_submission", {
            route_id: String(new FormData(form).get("routeId")),
          });
          form.reset();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Unable to submit");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Route
        <select name="routeId" defaultValue={selected}>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        What needs correcting?
        <textarea name="message" required minLength={20} maxLength={3000} />
      </label>
      <label>
        Source or observation details
        <input name="source" maxLength={500} />
      </label>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: "none" }}
      />
      <Button disabled={busy}>
        {busy ? "Submitting…" : "Submit for review"}
      </Button>
      {message && <Alert>{message}</Alert>}
    </form>
  );
}
