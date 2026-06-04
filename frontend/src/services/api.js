import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: async (email, password) => {
    // OAuth2 expects form-encoded body
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    const response = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.removeItem("chat_messages");
    const me = await api.get("/auth/me");
    localStorage.setItem("user", JSON.stringify(me.data));
    return response;
  },
  me: () => api.get("/auth/me"),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
};

// Chat — signal is passed so the Stop button can abort in-flight requests
export const chatAPI = {
  send: (message, session_uid = null, system_prompt = "", signal) =>
    api.post(
      "/chat/chat",
      { message, session_uid, system_prompt },
      { signal }
    ),
  getSessions: () => api.get("/chat/sessions"),
  createSession: () => api.post("/chat/sessions"),
  getSessionMessages: (sessionUid) => api.get(`/chat/sessions/${sessionUid}/messages`),
  deleteSession: (sessionUid) => api.delete(`/chat/sessions/${sessionUid}`),
};

// RAG
export const ragAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/rag/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  query: (question, top_k = 4) =>
    api.post("/rag/query", { question, top_k }),
  listDocuments: () => api.get("/rag/documents"),
  deleteDocument: (id) => api.delete(`/rag/documents/${id}`),
  deleteAll: () => api.delete("/rag/documents"),
  getHistory: () => api.get("/rag/history"),
  clearHistory: () => api.delete("/rag/history"),
};

// Logs
export const logsAPI = {
  getLogs: (level = null, search = "", limit = 500) => {
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (search) params.append("search", search);
    params.append("limit", limit.toString());
    return api.get(`/logs?${params.toString()}`);
  },
  clearLogs: () => api.delete("/logs"),
};

export default api;
