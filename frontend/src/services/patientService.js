import api from "./api";

export async function getPatientProfile() {
  const { data } = await api.get("/patients/me");
  return data;
}

export async function updatePatientProfile(payload) {
  const { data } = await api.put("/patients/me", payload);
  return data;
}

export async function uploadPatientPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/patients/me/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getMedicalRecords() {
  const { data } = await api.get("/medical-records/me");
  return data;
}

export async function getPrescriptions() {
  const { data } = await api.get("/prescriptions/me");
  return data;
}

// ── File-based prescription files uploaded by doctors ──

export async function getMyPrescriptionFiles() {
  const { data } = await api.get("/prescription-files/my-files");
  return data;
}

export async function getPatientStats() {
  const { data } = await api.get("/patients/me/stats");
  return data;
}

export async function getRecordByAppointment(appointmentId) {
  const { data } = await api.get(`/medical-records/appointment/${appointmentId}`);
  return data;
}
