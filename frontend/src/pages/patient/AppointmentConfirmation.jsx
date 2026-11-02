import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getAppointmentDetails } from "../../services/appointmentService.js";
import { fadeInUp } from "../../components/animations/variants.js";

export default function AppointmentConfirmation() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAppointmentDetails(appointmentId)
      .then((data) => isMounted && setAppointment(data))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  if (isLoading) return <LoadingState label="Confirming your appointment..." />;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-lg">
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clinic-50 text-2xl text-clinic-600">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Appointment booked</h1>
        <p className="mt-1 text-sm text-slate-500">
          A confirmation has been sent to your notifications.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Doctor</span>
            <span className="text-slate-700">{appointment?.counterpart_name || appointment?.counterpartName || "Doctor"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Date &amp; time</span>
            <span className="text-slate-700">
              {appointment?.date} · {appointment?.time}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Status</span>
            <StatusBadge status={appointment?.status || "booked"} />
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link to="/patient/appointments">
            <Button variant="primary">View my appointments</Button>
          </Link>
          <Link to="/patient/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
