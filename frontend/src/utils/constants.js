// Only two roles exist in this system. Keep this list intentionally short —
// adding a role here must be matched by backend role checks.
export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
};

// Appointment lifecycle. CANCELLED is a separate terminal state reachable
// from BOOKED or CONFIRMED (not from COMPLETED).
export const APPOINTMENT_STATUS = {
  BOOKED: "booked",
  CONFIRMED: "confirmed",
  IN_CONSULTATION: "in_consultation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const NOTIFICATION_TYPES = {
  APPOINTMENT_CONFIRMATION: "appointment_confirmation",
  APPOINTMENT_CANCELLATION: "appointment_cancellation",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  APPOINTMENT_REMINDER: "appointment_reminder",
  FOLLOW_UP_REMINDER: "follow_up_reminder",
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
