import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { STATUSES, STAT_ICONS } from "../constants.js";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";

// small helper so the stat card picks up its colour modifier from index.css
function StatCard({ label, value }) {
  return (
    <div className={`stat-card stat-${label.toLowerCase()}`}>
      <span className="stat-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={STAT_ICONS[label]} />
        </svg>
      </span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // dashboard stats load once on mount
  useEffect(() => {
    api.stats().then(setStats).catch((err) => setError(err.message));
  }, []);

  // list re-fetches from the backend whenever search or status filter changes
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .list({ search, status })
        .then(setApplications)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300); // debounce so every keystroke doesn't fire a request
    return () => clearTimeout(timeout);
  }, [search, status]);

  async function handleStatusChange(id, newStatus) {
    const updated = await api.update(id, { status: newStatus });
    setApplications((prev) => prev.map((a) => (a._id === id ? updated : a)));
    api.stats().then(setStats); // counts shift when a status changes
  }

  async function handleDelete(id) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    await api.remove(id);
    setApplications((prev) => prev.filter((a) => a._id !== id));
    api.stats().then(setStats);
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Stay on top of every opportunity</p>
        </div>
        <Link to="/new" className="btn btn-primary">
          + Add Application
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total" value={stats.total} />
          {STATUSES.map((s) => (
            <StatCard key={s} label={s} value={stats.statusCounts[s] || 0} />
          ))}
        </div>
      )}

      {stats?.upcomingInterviews?.length > 0 && (
        <div className="card upcoming">
          <h2>Upcoming Interviews (next 7 days)</h2>
          <ul>
            {stats.upcomingInterviews.map((i) => (
              <li key={i._id}>
                <Link to={`/applications/${i._id}`}>
                  {i.company} — {i.position}
                </Link>{" "}
                on {new Date(i.interviewDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="filters">
        <div className="search-field">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search company or position..."
            aria-label="Search applications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="status-pills" role="group" aria-label="Filter by status">
          <button
            type="button"
            className="pill"
            aria-pressed={status === ""}
            onClick={() => setStatus("")}
          >
            All Statuses
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className="pill"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card-list">
          {applications.map((app) => (
            <div className="card app-card" key={app._id}>
              <div className="app-card-main">
                <Link to={`/applications/${app._id}`} className="app-title">
                  {app.position} @ {app.company}
                </Link>
                <div className="app-meta">
                  {app.location && <span>{app.location}</span>}
                  <span>Applied {new Date(app.dateApplied).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="app-card-actions">
                <StatusBadge status={app.status} />
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  aria-label={`Change status for ${app.company}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Link to={`/edit/${app._id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button className="btn btn-danger" onClick={() => handleDelete(app._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="card tip-card">
        <span className="tip-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6m-5 3h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
          </svg>
        </span>
        <div>
          <h4>Pro Tip for Seekers</h4>
          <p>
            Tailor each submission with keywords from the job spec. Following up within 5 business
            days boosts response rates.
          </p>
        </div>
      </section>
    </div>
  );
}
