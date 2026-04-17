import { useState } from "react";
import { authClient } from "../lib/auth-client";

export function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) setError(result.error.message ?? "Sign in failed");
      } else {
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) setError(result.error.message ?? "Sign up failed");
      }
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>TaskFlow</h1>
          <p>Real-time collaborative task management</p>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="name">Display Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus={mode === "signin"}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <div className="login-hint">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button className="btn-link" onClick={() => switchMode("signup")}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="btn-link" onClick={() => switchMode("signin")}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
