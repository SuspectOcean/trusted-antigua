"use client";

import { useEffect } from "react";

// Last line of defence: an error in the root layout itself, where the normal
// error boundary can't render because the shell has failed. This component must
// supply its own <html> and <body>, and cannot rely on the site's CSS being
// available — so the styling here is deliberately inline and self-contained.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[global error]", { digest: error?.digest, message: error?.message });
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0, minHeight: "100vh", background: "#0C1526", color: "#E8EDF3",
        fontFamily: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      }}>
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ fontSize: "34px", marginBottom: "10px" }}>⚠️</div>
          <h1 style={{ fontSize: "20px", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>
            Trusted Antigua is temporarily unavailable
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.5, color: "#9FB0C2", margin: "0 0 20px" }}>
            Something failed while loading the site. Your account and your reviews are unaffected.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#E8A54B", color: "#0C1526", border: "none", borderRadius: "999px",
              padding: "12px 22px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Reload
          </button>
          <p style={{ fontSize: "12px", color: "#7C8DA0", marginTop: "20px" }}>
            Still stuck? Email info@trustedantigua.com
            {error?.digest ? ` quoting reference ${error.digest}` : ""}.
          </p>
        </div>
      </body>
    </html>
  );
}
