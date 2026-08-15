import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { STATUSES } from "../constants.js";

const EMPTY = {
  company: "",
  position: "",
  status: "Applied",
  dateApplied: "",
  interviewDate: "",
  location: "",
  jobUrl: "",
  notes: "",
};

// converts an ISO date string to yyyy-mm-dd for <input type="date">
function toDateInput(value) {
  return value ? value.slice(0, 10) : "";
}

export default function ApplicationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(id).then((app) =>
      setForm({
        ...app,
        dateApplied: toDateInput(app.dateApplied),
        interviewDate: toDateInput(app.interviewDate),
      })
    );
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, interviewDate: form.interviewDate || null };
      const saved = isEdit ? await api.update(id, payload) : await api.create(payload);
      navigate(`/applications/${saved._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{isEdit ? "Edit Application" : "Add Application"}</h1>
      </div>

      {error && <p className="error">{error}</p>}

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Company *
          <input name="company" value={form.company} onChange={handleChange} required />
        </label>

        <label>
          Position *
          <input name="position" value={form.position} onChange={handleChange} required />
        </label>

        <div className="form-row">
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date Applied *
            <input
              type="date"
              name="dateApplied"
              value={form.dateApplied}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Interview Date
            <input
              type="date"
              name="interviewDate"
              value={form.interviewDate}
              onChange={handleChange}
            />
          </label>
        </div>

        <label>
          Location
          <input name="location" value={form.location} onChange={handleChange} />
        </label>

        <label>
          Job URL
          <input type="url" name="jobUrl" value={form.jobUrl} onChange={handleChange} />
        </label>

        <label>
          Notes
          <textarea name="notes" rows={5} value={form.notes} onChange={handleChange} />
        </label>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
