"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary — only hit when the root layout itself throws. It has to
 * ship its own <html>/<body>, so the markup is deliberately minimal and
 * dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f7f7",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 420, padding: 40, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px" }}>
            The app ran into an unexpected problem. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 14,
              cursor: "pointer",
              background: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
