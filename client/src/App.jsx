import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";

export default function App() {
  return (
    <>
      <header className="navbar">
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
