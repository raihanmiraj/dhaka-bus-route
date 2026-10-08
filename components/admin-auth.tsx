"use client";
import { createAuthClient } from "better-auth/react";
import { useState } from "react";
import { Button, Alert } from "./ui";
import { FiEye, FiEyeOff, FiArrowRight, FiLogOut } from "react-icons/fi";
const auth = createAuthClient();
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
  return (
    <form
      className="admin-login-fields"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setError("");
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const r = await auth.signIn.email({
            email: String(f.get("email")).trim(),
            password: String(f.get("password")),
          });
          if (r.error) setError(r.error.message ?? "Sign in failed");
          else location.href = "/admin";
        } catch {
          setError("Sign in is temporarily unavailable. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="you@example.com"
          required
          disabled={busy}
        />
      </label>
      <label>
        Password
        <span className="admin-password-field">
          <input
            type={visible ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            disabled={busy}
            placeholder="Enter your password"
          />
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
          </button>
        </span>
      </label>
      <Button disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
        <FiArrowRight aria-hidden />
      </Button>
      {error && <Alert>{error}</Alert>}
      <p className="muted">
        Need access or a password reset? Contact the site owner.
      </p>
    </form>
  );
}
export function Logout() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Button
        className="secondary admin-signout"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await auth.signOut();
            if (r.error) throw new Error();
            location.href = "/admin/login";
          } catch {
            setError("Could not sign out. Try again.");
            setBusy(false);
          }
        }}
      >
        <FiLogOut aria-hidden /> {busy ? "Signing out…" : "Sign out"}
      </Button>
      {error && <Alert>{error}</Alert>}
    </>
  );
}
