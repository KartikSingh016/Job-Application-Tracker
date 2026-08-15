import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(id).then(setApp).catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    await api.remove(id);
    navigate("/");
  }

  if (error) return <div className="container error">{error}</div>;
  if (!app) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>
          {app.position} @ {app.company}
        </h1>
        <StatusBadge status={app.status} />
      </div>

      <div className="card detail">
        <dl>
          <dt>Date Applied</dt>
          <dd>{new Date(app.dateApplied).toLocaleDateString()}</dd>

          {app.interviewDate && (
            <>
              <dt>Interview Date</dt>
              <dd>{new Date(app.interviewDate).toLocaleDateString()}</dd>
            </>
          )}

          {app.location && (
            <>
              <dt>Location</dt>
              <dd>{app.location}</dd>
            </>
          )}

          {app.jobUrl && (
            <>
              <dt>Job Posting</dt>
              <dd>
                <a href={app.jobUrl} target="_blank" rel="noreferrer">
                  {app.jobUrl}
                </a>
              </dd>
            </>
          )}

          {app.notes && (
            <>
              <dt>Notes</dt>
              <dd className="notes">{app.notes}</dd>
            </>
          )}
        </dl>

        <div className="form-actions">
          <Link to="/" className="btn btn-secondary">
            Back
          </Link>
          <Link to={`/edit/${app._id}`} className="btn btn-primary">
            Edit
          </Link>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
