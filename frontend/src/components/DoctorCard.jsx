import React from "react";
import { motion } from "framer-motion";
import { cardHover } from "./animations/variants.js";
import Button from "./Button.jsx";

/**
 * Summary card for a doctor, used on Find Doctors and Public Doctors pages.
 */
export default function DoctorCard({ doctor, onViewProfile }) {
  const name = doctor?.full_name || doctor?.name || "Doctor";
  const specialization = doctor?.specialization || "General Medicine";
  const qualification = doctor?.qualification || "Medical Specialist";
  const experienceYears = doctor?.experience_years ?? doctor?.experienceYears;
  const photoUrl = doctor?.photo_url || doctor?.photoUrl;
  const consultationInfo = doctor?.consultation_info || doctor?.consultationInfo;

  return (
    <motion.div
      className="card flex flex-col gap-4 sm:flex-row sm:items-center"
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-clinic-100">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-clinic-700">
            {name ? name.charAt(0).toUpperCase() : "D"}
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold text-slate-900">{name}</h3>
        <p className="text-sm font-medium text-clinic-700">{specialization}</p>
        <p className="mt-1 text-xs text-slate-500">
          {qualification}
          {experienceYears !== null && experienceYears !== undefined
            ? ` · ${experienceYears} yrs experience`
            : ""}
          {consultationInfo ? ` · ${consultationInfo}` : ""}
        </p>
      </div>

      <Button variant="secondary" onClick={onViewProfile}>
        View profile
      </Button>
    </motion.div>
  );
}
