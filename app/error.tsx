"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card">
      <h1>This page is temporarily unavailable</h1>
      <p>
        Content could not be loaded. If you are setting up the site, check the
        server database configuration and network access.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <p>
        <a href="/">Return to route search</a>
      </p>
    </div>
  );
}
