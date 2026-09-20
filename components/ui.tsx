import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
export function Button(p: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`button ${p.className ?? ""}`} />;
}
export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`input ${p.className ?? ""}`} />;
}
export function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p className="alert" role="status">
      {children}
    </p>
  );
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function Skeleton() {
  return (
    <div className="skeleton" aria-label="Loading" role="status">
      Loading…
    </div>
  );
}
export function StopList({ stops }: { stops: string[] }) {
  return (
    <ol className="stop-list">
      {stops.map((s, i) => (
        <li key={`${s}-${i}`}>{s}</li>
      ))}
    </ol>
  );
}
export function Pagination({
  page,
  total,
  base,
}: {
  page: number;
  total: number;
  base: string;
}) {
  const url = (n: number) =>
    `${base}${base.includes("?") ? "&" : "?"}page=${n}`;
  return (
    <nav aria-label="Pagination" className="row">
      {page > 1 && <Link href={url(page - 1)}>← Previous</Link>}
      <span>
        Page {page} of {Math.max(total, 1)}
      </span>
      {page < total && <Link href={url(page + 1)}>Next →</Link>}
    </nav>
  );
}
export function RouteCard({
  bus,
  segment,
}: {
  bus: { slug: string; bus: string; routeStops: string[] };
  segment?: string[];
}) {
  return (
    <Card>
      <Badge>Source-listed route · verification pending</Badge>
      <h3>
        <Link href={`/buses/${bus.slug}`}>{bus.bus}</Link>
      </h3>
      <p>
        {segment ? "Selected journey" : "Listed route"} ·{" "}
        {(segment ?? bus.routeStops).length} stops
      </p>
      <StopList stops={segment ?? bus.routeStops} />
    </Card>
  );
}
export function PostCard({
  post,
}: {
  post: { slug: string; title: string; excerpt: string; locale: string };
}) {
  return (
    <Card>
      <h2 lang={post.locale}>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p lang={post.locale}>{post.excerpt}</p>
      <Link href={`/blog/${post.slug}`}>Read article →</Link>
    </Card>
  );
}
