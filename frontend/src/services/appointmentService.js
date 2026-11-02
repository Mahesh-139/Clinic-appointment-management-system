import api from "./api";

// Appointment endpoints. Slot validation and double-booking prevention are
// enforced server-side (see backend/app/services/appointment_service.py) —
// this file only defines the client-side contract for Phase 1.

export async function getAvailableSlots(doctorId, date) {
  const { data } = await api.get(`/availability/${doctorId}/slots`, {
    params: { date },
  });
  return data;
}

export async function bookAppointment(payload) {
  const { data } = await api.post("/appointments", {
    doctor_id: payload.doctorId || payload.doctor_id,
    date: payload.date,
    slot: payload.slot,
    reason_for_visit: payload.reasonForVisit || payload.reason_for_visit,
  });
  return data;
}

export async function rescheduleAppointment(appointmentId, payload) {
  const { data } = await api.patch(`/appointments/${appointmentId}/reschedule`, payload);
  return data;
}

export async function cancelAppointment(appointmentId) {
  const { data } = await api.patch(`/appointments/${appointmentId}/cancel`);
  return data;
}

export async function getMyAppointments(params) {
  const { data } = await api.get("/appointments/me", { params });
  return data;
}

export async function getAppointmentDetails(appointmentId) {
  const { data } = await api.get(`/appointments/${appointmentId}`);
  return data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data } = await api.patch(`/appointments/${appointmentId}/status`, { status });
  return data;
}
