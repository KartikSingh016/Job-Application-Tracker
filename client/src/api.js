const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export const api = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs}` : "";
    return request(`/applications${suffix}`);
  },
  get: (id) => request(`/applications/${id}`),
  create: (body) => request("/applications", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    request(`/applications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/applications/${id}`, { method: "DELETE" }),
  stats: () => request("/applications/stats"),
};
