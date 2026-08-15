import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { STATUSES } from "../constants.js";
import StatusBadge from "../components/StatusBadge.jsx";

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
        <h1>Dashboard</h1>
        <Link to="/new" className="btn btn-primary">
          + Add Application
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          {STATUSES.map((s) => (
            <div className="stat-card" key={s}>
              <span className="stat-value">{stats.statusCounts[s] || 0}</span>
              <span className="stat-label">{s}</span>
            </div>
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
        <input
          type="text"
          placeholder="Search by company or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : applications.length === 0 ? (
        <p className="empty">No applications yet. Add your first one!</p>
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
    </div>
  );
}
