import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// The Google Identity Services script is loaded async from index.html, so it may
// not be ready when this mounts. Poll briefly rather than racing it.
function whenGoogleReady(callback) {
  let tries = 0;
  const timer = setInterval(() => {
    if (window.google?.accounts?.id) {
      clearInterval(timer);
      callback(true);
    } else if (++tries > 50) {
      // ~5s: script blocked by an extension or offline
      clearInterval(timer);
      callback(false);
    }
  }, 100);
  return () => clearInterval(timer);
}

export default function Login() {
  const { signIn } = useAuth();
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    return whenGoogleReady((ready) => {
      if (!ready) {
        setBlocked(true);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: ({ credential }) => {
          setError("");
          signIn(credential).catch((err) => setError(err.message));
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 280,
      });
    });
  }, [signIn]);

  return (
    <div className="login-screen">
      <div className="card login-card">
        <span className="brand-mark login-mark">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </span>

        <h1>Job Application Tracker</h1>
        <p>
          Sign in to keep your own private board of companies, stage updates, interview rounds, and
          notes.
        </p>

        {error && <p className="error">{error}</p>}

        {!CLIENT_ID ? (
          <p className="error">
            Google sign-in isn&apos;t configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in the
            client environment and reload.
          </p>
        ) : blocked ? (
          <p className="error">
            Couldn&apos;t load Google sign-in. Check your connection or any script blocker, then
            reload.
          </p>
        ) : (
          <div className="google-button" ref={buttonRef} />
        )}

        <p className="login-fineprint">
          We only read your name, email, and profile picture — just enough to keep your board yours.
        </p>
      </div>
    </div>
  );
}
