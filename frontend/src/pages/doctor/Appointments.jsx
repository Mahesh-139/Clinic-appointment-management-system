import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { getDoctorAppointments } from "../../services/doctorService.js";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function Appointments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("today");
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    getDoctorAppointments({ scope: tab })
      .then((data) => {
        if (!isMounted) return;
        setAppointments(data || []);
        setStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => isMounted && setStatus("error"));
    return () => {
      isMounted = false;
    };
  }, [tab]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-clinic-600 text-clinic-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState onRetry={() => setTab((t) => t)} />}
        {status === "empty" && (
          <EmptyState title={`No ${tab} appointments`} description="Check back later." />
        )}
        {status === "success" &&
          appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
            />
          ))}
      </div>
    </div>
  );
}
