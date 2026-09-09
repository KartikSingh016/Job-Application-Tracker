const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    // fetch only rejects on network-level failure — server down, wrong VITE_API_URL, CORS
    throw new Error(`Can't reach the API at ${BASE_URL}. Is the server running?`);
  }
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
