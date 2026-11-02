import api from "./api";

export async function searchDoctors(params) {
  const { data } = await api.get("/doctors", { params });
  return data;
}

export async function getDoctorProfile(doctorId) {
  const { data } = await api.get(`/doctors/${doctorId}`);
  return data;
}

export async function getDoctorOwnProfile() {
  const { data } = await api.get("/doctors/me");
  return data;
}

export async function updateDoctorProfile(payload) {
  const { data } = await api.put("/doctors/me", payload);
  return data;
}

export async function uploadDoctorPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/doctors/me/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getAvailability() {
  const { data } = await api.get("/availability/me");
  return data;
}

export async function setAvailability(payload) {
  const { data } = await api.put("/availability/me", payload);
  return data;
}

export async function getDoctorAppointments(params) {
  const { data } = await api.get("/doctors/me/appointments", { params });
  return data;
}

export async function getPatientDetails(patientId) {
  const { data } = await api.get(`/doctors/me/patients/${patientId}`);
  return data;
}

export async function getPatientAppointmentHistory(patientId) {
  const { data } = await api.get(`/doctors/me/patients/${patientId}/appointments`);
  return data;
}

export async function getPatientMedicalHistory(patientId) {
  const { data } = await api.get(`/doctors/me/patients/${patientId}/medical-history`);
  return data;
}

export async function createConsultationRecord(appointmentId, payload) {
  const { data } = await api.post(`/medical-records/appointments/${appointmentId}`, payload);
  return data;
}

export async function createPrescription(appointmentId, payload) {
  const { data } = await api.post(`/prescriptions/appointments/${appointmentId}`, payload);
  return data;
}

export async function getIssuedMedicalRecords() {
  const { data } = await api.get("/medical-records/issued-by-me");
  return data;
}

export async function getIssuedPrescriptions() {
  const { data } = await api.get("/prescriptions/issued-by-me");
  return data;
}

// ── Prescription file functions (file-based prescriptions to patients) ──

export async function searchPatientsForPrescription(q) {
  const { data } = await api.get("/prescription-files/patients", { params: { q } });
  return data;
}

export async function uploadPrescriptionFileToPatient(patientId, file, notes) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) formData.append("notes", notes);
  const { data } = await api.post(`/prescription-files/patient/${patientId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getDoctorIssuedPrescriptionFiles() {
  const { data } = await api.get("/prescription-files/issued-by-me");
  return data;
}

export async function getDoctorStats() {
  const { data } = await api.get("/doctors/me/stats");
  return data;
}

export async function updateConsultationRecord(recordId, payload) {
  const { data } = await api.put(`/medical-records/${recordId}`, payload);
  return data;
}

export async function getRecordByAppointment(appointmentId) {
  const { data } = await api.get(`/medical-records/appointment/${appointmentId}`);
  return data;
}
