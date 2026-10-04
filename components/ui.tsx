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
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
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
  const stops = segment ?? bus.routeStops;
  return (
    <Card className="route-card">
      <Badge>Source-listed route · verification pending</Badge>
      <h3>
        <Link href={`/buses/${bus.slug}`}>{bus.bus}</Link>
      </h3>
      <div className="route-meta">
        <span className="badge">
          {segment ? "Selected journey" : "Full route"}
        </span>
        <span className="badge">{stops.length} stops</span>
        <span className="badge">Map available</span>
      </div>
      <StopList stops={stops.slice(0, 8)} />
      {stops.length > 8 && (
        <p className="muted">
          +{stops.length - 8} more stops on the bus page map
        </p>
      )}
      <div className="row">
        <Link className="button" href={`/buses/${bus.slug}`}>
          View details & map →
        </Link>
      </div>
    </Card>
  );
}
export function PostCard({
  post,
}: {
  post: { slug: string; title: string; excerpt: string; locale: string };
}) {
  return (
    <Card className="post-card">
      <span className="post-kicker">Guide</span>
      <h2 lang={post.locale}>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p lang={post.locale}>{post.excerpt}</p>
      <Link className="read-more" href={`/blog/${post.slug}`}>
        Read article →
      </Link>
    </Card>
  );
}
