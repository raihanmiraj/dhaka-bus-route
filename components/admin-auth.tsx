"use client";
import { createAuthClient } from "better-auth/react";
import { useState } from "react";
import { Button, Alert } from "./ui";
const auth = createAuthClient();
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card"
      style={{ maxWidth: 480 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const r = await auth.signIn.email({
            email: String(f.get("email")),
            password: String(f.get("password")),
          });
          if (r.error) setError(r.error.message ?? "Sign in failed");
          else location.href = "/admin";
        } catch {
          setError("Authentication unavailable. Check server setup.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      {error && <Alert>{error}</Alert>}
      <p className="muted">
        Accounts are created by the site owner. There is no public registration.
      </p>
    </form>
  );
}
export function Logout() {
  return (
    <Button
      className="secondary"
      onClick={async () => {
        await auth.signOut();
        location.href = "/admin/login";
      }}
    >
      Sign out
    </Button>
  );
}
