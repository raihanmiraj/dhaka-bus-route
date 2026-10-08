"use client";
import { useEffect, useState } from "react";
import { FiKey, FiCopy, FiPlus } from "react-icons/fi";
import { api } from "./admin-api";
import { Alert, Button } from "./ui";
type Key = {
  _id: string;
  name: string;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";
const state = (key: Key) =>
  key.revokedAt
    ? "Revoked"
    : key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()
      ? "Expired"
      : "Active";
export function ApiKeysPanel() {
  const [keys, setKeys] = useState<Key[]>([]),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [revoking, setRevoking] = useState("");
  const load = async () => {
    setKeys(await api("api-keys"));
    setLoaded(true);
  };
  useEffect(() => {
    void load().catch((e) => setMessage(e.message));
  }, []);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">INTEGRATIONS</p>
          <h1>API keys</h1>
          <p>Connect your tools to the same publishing workflow.</p>
        </div>
        <span className="admin-page-icon">
          <FiKey aria-hidden />
        </span>
      </div>
      {message && <Alert>{message}</Alert>}
      {token && (
        <section className="card admin-key-reveal" aria-label="New API key">
          <h2>Copy your new key</h2>
          <p>
            This is the only time the full key is shown. It grants your
            administrator permissions.
          </p>
          <label>
            New API key
            <input
              value={token}
              readOnly
              spellCheck={false}
              autoComplete="off"
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className="row">
            <Button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(token);
                  setMessage("API key copied.");
                } catch {
                  setMessage("Select the key above and copy it manually.");
                }
              }}
            >
              <FiCopy aria-hidden /> Copy key
            </Button>
            <Button
              type="button"
              className="secondary"
              onClick={() => {
                setToken("");
                setMessage("");
              }}
            >
              I have saved it
            </Button>
          </div>
        </section>
      )}
      <div className="admin-key-grid">
        <form
          className="card"
          aria-busy={busy}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || token) return;
            const form = e.currentTarget,
              f = new FormData(form);
            setBusy(true);
            setMessage("");
            try {
              const r = await api("api-keys", "POST", {
                name: f.get("name"),
                expiresInDays:
                  f.get("expiry") === "never" ? null : Number(f.get("expiry")),
              });
              setToken(r.token);
              form.reset();
              await load();
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Create a key</h2>
          <p>
            Give each integration its own key so you can revoke it
            independently.
          </p>
          <label>
            Key name
            <input
              name="name"
              placeholder="e.g. Blog publishing assistant"
              required
              maxLength={80}
              disabled={busy}
            />
          </label>
          <label>
            Expiration
            <select name="expiry" defaultValue="90" disabled={busy}>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="never">No expiration</option>
            </select>
          </label>
          <Button disabled={busy || !!token}>
            <FiPlus aria-hidden />
            {busy ? "Creating…" : "Create API key"}
          </Button>
        </form>
        <section className="card admin-api-example">
          <h2>Use Bearer authentication</h2>
          <p>
            Send the key in the Authorization header. Session cookies and an
            Origin header are not needed for key-authenticated requests.
          </p>
          <pre>
            <code>
              {
                'curl https://www.dhakabusroutes.com/api/admin/posts \\\n  -H "Authorization: Bearer YOUR_API_KEY"'
              }
            </code>
          </pre>
          <p>
            Works with posts, publishing, categories, tags, media, settings,
            corrections and key management, plus <code>/api/upload</code> and
            private media.
          </p>
          <p>
            For a post change, include its current <code>version</code>. Save
            the draft with <code>/api/admin/posts/ID/save</code>, then publish
            with <code>/api/admin/posts/ID/publish</code>.
          </p>
          <p className="muted">
            Keep the key in your tool’s secret settings. Browser dashboard
            sign-in continues to use your email and password.
          </p>
        </section>
      </div>
      <section className="card admin-key-list">
        <div className="admin-section-heading">
          <h2>Your API keys</h2>
          <span className="muted">
            {keys.filter((k) => state(k) === "Active").length} active
          </span>
        </div>
        {!loaded ? (
          <p role="status">Loading keys…</p>
        ) : !keys.length ? (
          <div className="empty">
            <FiKey aria-hidden />
            <h3>No API keys yet</h3>
            <p>Create your first key to connect a publishing tool.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name / key</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Expires</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k._id}>
                    <td>
                      <strong>{k.name}</strong>
                      <small>{k.prefix}</small>
                    </td>
                    <td>
                      <span
                        className={`admin-status ${state(k) === "Active" ? "status-published" : "status-archived"}`}
                      >
                        {state(k)}
                      </span>
                    </td>
                    <td>{date(k.createdAt)}</td>
                    <td>
                      {k.lastUsedAt ? date(k.lastUsedAt) : "Not used yet"}
                    </td>
                    <td>{k.expiresAt ? date(k.expiresAt) : "Never"}</td>
                    <td>
                      {state(k) === "Active" ? (
                        <Button
                          className="secondary admin-revoke"
                          disabled={!!revoking}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                `Revoke “${k.name}”? Tools using it will lose access immediately.`,
                              )
                            )
                              return;
                            setRevoking(k._id);
                            setMessage("");
                            try {
                              await api(`api-keys/${k._id}`, "DELETE");
                              await load();
                              setMessage("API key revoked.");
                            } catch (e) {
                              setMessage((e as Error).message);
                            } finally {
                              setRevoking("");
                            }
                          }}
                        >
                          {revoking === k._id ? "Revoking…" : "Revoke"}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
