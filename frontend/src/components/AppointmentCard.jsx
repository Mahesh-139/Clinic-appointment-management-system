import React from "react";
import { motion } from "framer-motion";
import { cardHover } from "./animations/variants.js";
import StatusBadge from "./StatusBadge.jsx";

/**
 * Summary card for a single appointment, used in My Appointments /
 * Doctor Appointments lists.
 */
export default function AppointmentCard({ appointment, onClick }) {
  const { date, time, status } = appointment || {};
  const counterpartName = appointment?.counterpart_name || appointment?.counterpartName || "Appointment";
  const reasonForVisit = appointment?.reason_for_visit || appointment?.reasonForVisit;

  return (
    <motion.button
      onClick={onClick}
      className="card flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{counterpartName}</p>
        <p className="text-xs text-slate-500">
          {date || "Date"} · {time || "Time"}
        </p>
        {reasonForVisit && <p className="mt-1 text-xs text-slate-400">{reasonForVisit}</p>}
      </div>
      <StatusBadge status={status} />
    </motion.button>
  );
}
