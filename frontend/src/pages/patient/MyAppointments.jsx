import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { getMyAppointments } from "../../services/appointmentService.js";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "history", label: "History" },
];

export default function MyAppointments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    getMyAppointments({ scope: tab })
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
      <h1 className="text-2xl font-semibold text-slate-900">My appointments</h1>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
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
          <EmptyState
            title={`No ${tab} appointments`}
            description={
              tab === "upcoming"
                ? "Book a visit to see it listed here."
                : "Past appointments will appear here once completed."
            }
          />
        )}
        {status === "success" &&
          appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onClick={() => navigate(`/patient/appointments/${appt.id}`)}
            />
          ))}
      </div>
    </div>
  );
}
