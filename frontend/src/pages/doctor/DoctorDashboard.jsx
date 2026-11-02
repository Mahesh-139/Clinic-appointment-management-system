import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { getDoctorAppointments, getDoctorStats } from "../../services/doctorService.js";

export default function DoctorDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeScope, setActiveScope] = useState("today");
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");

  // Fetch stats on mount
  useEffect(() => {
    let isMounted = true;
    getDoctorStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch appointments whenever activeScope changes
  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    getDoctorAppointments({ scope: activeScope })
      .then((data) => {
        if (!isMounted) return;
        setAppointments(data || []);
        setStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => isMounted && setStatus("empty"));
    return () => {
      isMounted = false;
    };
  }, [activeScope]);

  const doctorName = user?.full_name || user?.fullName || "Doctor";

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good day, Dr. {doctorName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is your clinic practice summary and patient appointment schedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/doctor/availability">
            <Button variant="secondary" size="sm">Manage Availability</Button>
          </Link>
          <Link to="/doctor/prescriptions">
            <Button variant="primary" size="sm">Issue Prescription</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today's Visits
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.today_count ?? (activeScope === "today" ? appointments.length : 0)}
            </p>
            <button
              onClick={() => setActiveScope("today")}
              className={`text-xs font-medium ${
                activeScope === "today" ? "text-clinic-800 font-bold" : "text-clinic-600 hover:text-clinic-800"
              }`}
            >
              Filter →
            </button>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Schedule
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.upcoming_count ?? 0}
            </p>
            <button
              onClick={() => setActiveScope("upcoming")}
              className={`text-xs font-medium ${
                activeScope === "upcoming" ? "text-clinic-800 font-bold" : "text-clinic-600 hover:text-clinic-800"
              }`}
            >
              Filter →
            </button>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed Visits
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.completed_count ?? 0}
            </p>
            <button
              onClick={() => setActiveScope("completed")}
              className={`text-xs font-medium ${
                activeScope === "completed" ? "text-clinic-800 font-bold" : "text-clinic-600 hover:text-clinic-800"
              }`}
            >
              Filter →
            </button>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Patients Treated
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.total_patients ?? 0}
            </p>
            <Link
              to="/doctor/prescriptions"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              {stats?.total_prescriptions ?? 0} Rx files
            </Link>
          </div>
        </Card>
      </div>

      {/* Appointments Section with Scope Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Appointment Queue</h2>

          {/* Scope Filters */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {[
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "pending", label: "Pending" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveScope(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeScope === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {status === "loading" && <LoadingState label="Loading appointments..." />}

          {status === "empty" && (
            <EmptyState
              title={`No ${activeScope} appointments`}
              description={
                activeScope === "today"
                  ? "You have no appointments scheduled for today."
                  : activeScope === "upcoming"
                  ? "No upcoming future appointments scheduled."
                  : activeScope === "pending"
                  ? "No pending unconfirmed appointments."
                  : "No completed appointments yet."
              }
            />
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
    </div>
  );
}
