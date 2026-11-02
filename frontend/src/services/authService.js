import api from "./api";

// Auth endpoints. Implementation wired up in Phase 5 — these currently
// define the contract the rest of the app is built against.

export async function registerPatient(payload) {
  const { data } = await api.post("/auth/register/patient", payload);
  return data;
}

export async function registerDoctor(payload) {
  const { data } = await api.post("/auth/register/doctor", payload);
  return data;
}


export async function loginPatient(credentials) {
  const { data } = await api.post("/auth/login/patient", credentials);
  return data;
}

export async function loginDoctor(credentials) {
  const { data } = await api.post("/auth/login/doctor", credentials);
  return data;
}

export async function logout() {
  try {
    // Stateless JWT: the backend call is a no-op today (see
    // backend/app/routers/auth.py) but keeping it means a future
    // token-blocklist can be added there without a frontend change.
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  }
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function deleteMyAccount() {
  try {
    await api.delete("/auth/me");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  }
}
