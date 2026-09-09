const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "jobtracker.token";

// localStorage throws in some privacy modes, so every access is guarded
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing we can do; the session just won't survive a reload */
  }
}

async function request(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch only rejects on network-level failure — server down, wrong VITE_API_URL, CORS
    throw new Error(`Can't reach the API at ${BASE_URL}. Is the server running?`);
  }

  const data = await res.json().catch(() => null);

  // an expired or rejected token means the stored session is dead; drop it and
  // let the app know so it can show the login screen instead of a stale error
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("auth:expired"));
  }

  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export const auth = {
  google: (credential) =>
    request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  me: () => request("/auth/me"),
};

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
