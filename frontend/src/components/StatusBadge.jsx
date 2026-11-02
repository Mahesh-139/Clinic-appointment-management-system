import React from "react";
import { APPOINTMENT_STATUS } from "../utils/constants";

const STYLES = {
  [APPOINTMENT_STATUS.BOOKED]: "bg-amber-50 text-amber-700 border-amber-200",
  [APPOINTMENT_STATUS.CONFIRMED]: "bg-blue-50 text-blue-700 border-blue-200",
  [APPOINTMENT_STATUS.IN_CONSULTATION]: "bg-purple-50 text-purple-700 border-purple-200",
  [APPOINTMENT_STATUS.COMPLETED]: "bg-clinic-50 text-clinic-700 border-clinic-200",
  [APPOINTMENT_STATUS.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
};

const LABELS = {
  [APPOINTMENT_STATUS.BOOKED]: "Booked",
  [APPOINTMENT_STATUS.CONFIRMED]: "Confirmed",
  [APPOINTMENT_STATUS.IN_CONSULTATION]: "In consultation",
  [APPOINTMENT_STATUS.COMPLETED]: "Completed",
  [APPOINTMENT_STATUS.CANCELLED]: "Cancelled",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = LABELS[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
