import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafaf8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      {/* Logo */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "48px" }}>
        {["S","C","R","U","M"].map(l => (
          <img key={l} src={`/logo/${l}.png?v=9`} style={{ height: "40px", width: "auto" }} alt={l} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: "#fff",
        border: "1px solid #e0ddd8",
        padding: "40px 48px",
        width: "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}>
        <div>
          <h1 style={{ fontFamily: "WiredDisplay, helvetica, sans-serif", fontSize: "28px", fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
            Welcome back.
          </h1>
          <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "14px", color: "#6b6b6b", marginTop: "8px" }}>
            Sign in to your Scrum board.
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "#0a0a0a",
            color: "#fafaf8",
            border: "none",
            padding: "12px 24px",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Barlow, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.02em",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.2s",
            width: "100%",
          }}
        >
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>

        {error && (
          <p style={{ fontFamily: "Barlow, sans-serif", fontSize: "12px", color: "#dc2626", textAlign: "center", margin: 0 }}>
            {error}
          </p>
        )}

        <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: "12px", color: "#9b9b9b", textAlign: "center", margin: 0 }}>
          No password. No signup form. Just Google.
        </p>
      </div>

      <a href="/" style={{ marginTop: "24px", fontFamily: "Barlow, sans-serif", fontSize: "12px", color: "#6b6b6b", textDecoration: "none" }}>
        ← Back to home
      </a>
    </div>
  );
}
