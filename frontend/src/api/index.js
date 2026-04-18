export const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = `${API_URL}/api`;

export function getMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function getToken() {
  return localStorage.getItem("cx_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body && typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
    }
  }

  console.log(`📡 [API Request] ${options.method || 'GET'} ${BASE}${path}`);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`❌ [API Error] ${options.method || 'GET'} ${path} - Status: ${res.status}`, data.error);
    const err = new Error(data.error || "Request failed.");
    err.status = res.status;
    throw err;
  }
  console.log(`✅ [API Success] ${options.method || 'GET'} ${path} - Status: ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me"),
};

// ── Vault ─────────────────────────────────────────────────────────────────────
export const vaultApi = {
  get: () => request("/vault"),
};

// ── Capsules ──────────────────────────────────────────────────────────────────
export const capsuleApi = {
  create: (formData) => request("/capsules", { method: "POST", body: formData }),
  update: (id, formData) => request(`/capsules/${id}`, { method: "PUT", body: formData }),
  getById: (id) => request(`/capsules/${id}`),
  getByToken: (token) => request(`/capsules/share/${token}`),
  delete: (id) => request(`/capsules/${id}`, { method: "DELETE" }),
};

// ── Friends ───────────────────────────────────────────────────────────────────
export const friendsApi = {
  search: (q) => request(`/friends/search?q=${encodeURIComponent(q)}`),
  send: (capsuleId, recipientId) =>
    request(`/friends/send/${capsuleId}`, { method: "POST", body: { recipientId } }),
  status: (capsuleId) => request(`/friends/status/${capsuleId}`),
};

// ── Ghost Wall ────────────────────────────────────────────────────────────────
export const ghostApi = {
  list: () => request("/ghost"),
  post: (body) => request("/ghost", { method: "POST", body }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => request("/notifications/read-all", { method: "PUT" }),
};

// ── Insights ──────────────────────────────────────────────────────────────────
export const insightsApi = {
  get: () => request("/insights"),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request("/health".replace("/api", "").replace(BASE, "") || "/health"),
};
