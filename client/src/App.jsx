import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";
import Login from "./pages/Login.jsx";
import { useAuth } from "./auth.jsx";

function UserMenu() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <div className="user-menu">
      {user.picture ? (
        <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="avatar avatar-fallback">{(user.name || user.email)[0].toUpperCase()}</span>
      )}
      <span className="user-name">{user.name || user.email}</span>
      <button type="button" className="btn btn-ghost" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

export default function App() {
  const { status } = useAuth();

  // hold the UI still while a stored token is being revalidated, so we don't
  // flash the login screen at someone who is already signed in
  if (status === "loading") {
    return <div className="boot-screen">Loading...</div>;
  }

  if (status === "signed-out") {
    return <Login />;
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <svg
                width="20"
                height="20"
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
            <span>
              <span className="brand-name">Job Application Tracker</span>
              <br />
              <span className="brand-tag">Career Journey Hub</span>
            </span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/edit/:id" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
        </Routes>
      </main>
    </>
  );
}
