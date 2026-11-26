"use client";

import { useState, type SubmitEvent } from "react";

interface LoginFormProps {
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ error, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-layer">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 14a8 8 0 0 1 16 0v2H4v-2Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M3 16h18v3H3zM12 6V3M8 7 6 5m10 2 2-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="brand-name">MINEWATCH</div>
            <div className="brand-sub">SMART MINING HELMET</div>
          </div>
        </div>
        <h2>Sign in to your dashboard</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="Enter email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button
            className="btn primary"
            id="loginButton"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Connect to dashboard"}
          </button>
          <div className="login-error" id="loginError" role="alert">
            {error}
          </div>
        </form>
      </div>
    </div>
  );
}
