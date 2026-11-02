import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { getMyAppointments } from "../../services/appointmentService.js";
import { getPatientStats } from "../../services/patientService.js";
import { getNotifications } from "../../services/notificationService.js";

export default function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getMyAppointments({ scope: "upcoming" }),
      getPatientStats().catch(() => null),
      getNotifications().catch(() => []),
    ])
      .then(([apptsData, statsData, notifsData]) => {
        if (!isMounted) return;
        setUpcoming(apptsData || []);
        setStats(statsData);
        setRecentNotifications((notifsData || []).slice(0, 3));
        setStatus("success");
      })
      .catch(() => isMounted && setStatus("error"));

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = user?.full_name || user?.fullName || "Patient";
  const nextAppt = upcoming.length > 0 ? upcoming[0] : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your clinic consultations, medical records, and doctor appointments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/patient/find-doctors">
            <Button variant="primary">Book Appointment</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Visits
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats ? stats.upcoming_count : upcoming.length}
            </p>
            <Link
              to="/patient/appointments"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              View all →
            </Link>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Past Consultations
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.history_count ?? "0"}
            </p>
            <Link
              to="/patient/appointments"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              History →
            </Link>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Medical Records
          </p>
          <div className="mt-2 flex items-line justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.medical_records_count ?? "0"}
            </p>
            <Link
              to="/patient/medical-records"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              Records →
            </Link>
          </div>
        </Card>

        <Card className="hover:border-clinic-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Prescriptions
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.prescriptions_count ?? "0"}
            </p>
            <Link
              to="/patient/prescriptions"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              Files →
            </Link>
          </div>
        </Card>
      </div>

      {/* Next Appointment Spotlight */}
      {nextAppt && (
        <div className="rounded-xl border border-clinic-200 bg-gradient-to-r from-clinic-50/50 via-white to-clinic-50/20 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-clinic-100 px-2.5 py-0.5 text-xs font-semibold text-clinic-800">
                Next Appointment
              </span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                Dr. {nextAppt.counterpart_name || nextAppt.counterpartName || "Your Doctor"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  {nextAppt.appointment_date || nextAppt.appointmentDate || nextAppt.date}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-slate-800">
                  {String(nextAppt.appointment_time || nextAppt.appointmentTime || nextAppt.time).slice(0, 5)}
                </span>
                {nextAppt.reason_for_visit && ` · ${nextAppt.reason_for_visit}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={nextAppt.status} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/patient/appointments/${nextAppt.id}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upcoming Visits + Recent Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
            {upcoming.length > 0 && (
              <Link
                to="/patient/appointments"
                className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
              >
                View all ({upcoming.length})
              </Link>
            )}
          </div>

          {status === "loading" && <LoadingState />}
          {status === "empty" || (status === "success" && upcoming.length === 0) ? (
            <EmptyState
              title="No upcoming appointments"
              description="You have no scheduled appointments. Find a doctor to book your next consultation."
              action={
                <Link to="/patient/find-doctors">
                  <Button variant="secondary">Find a Doctor</Button>
                </Link>
              }
            />
          ) : null}

          {status === "success" && upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onClick={() => navigate(`/patient/appointments/${appt.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Updates</h2>
            <Link
              to="/patient/notifications"
              className="text-xs font-medium text-clinic-600 hover:text-clinic-800"
            >
              All Notifications →
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No recent notifications
              </div>
            ) : (
              recentNotifications.map((n) => {
                const isRead = n.is_read ?? n.isRead;
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors ${
                      isRead ? "opacity-70 bg-white" : "bg-clinic-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs ${isRead ? "text-slate-700" : "font-semibold text-slate-900"}`}>
                        {n.title}
                      </p>
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-clinic-600 shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
