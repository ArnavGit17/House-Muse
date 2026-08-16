import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

// Attach the Knox token (if present) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hm_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const register = (data: { username: string; email: string; password: string }) =>
  api.post("/api/auth/register/", data);

export const login = (data: { username: string; password: string }) =>
  api.post("/api/auth/login/", data);

export const googleLogin = (idToken: string) =>
  api.post("/api/auth/google/", { id_token: idToken });

export const logout = () => api.post("/api/auth/logout/");

export const fetchMe = () => api.get("/api/auth/me/");

export const requestPasswordReset = (email: string) =>
  api.post("/api/auth/password-reset/", { email });

export const confirmPasswordReset = (data: { token: string; password: string }) =>
  api.post("/api/auth/password-reset/confirm/", data);

// NOTE: field names below match the backend's real /api/studio/analyse/
// contract. `styles` must be a JSON-stringified array of styleId values
// (see lib/styles.ts buildStylePayload) — never the display name.
export const analyseRoom = (formData: FormData) =>
  api.post("/api/studio/analyse/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const generateRoomImage = (payload: { style: string; analysis: unknown }) =>
  api.post("/api/studio/generate-image/", payload);

export const listProjects = () => api.get("/api/studio/projects/");

export const deleteProject = (id: string | number) =>
  api.delete(`/api/studio/projects/${id}/`);
