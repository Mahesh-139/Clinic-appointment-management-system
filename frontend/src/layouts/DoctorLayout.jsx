import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { pageTransition } from "../components/animations/variants.js";

const LINKS = [
  { to: "/doctor/dashboard", label: "Dashboard" },
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/availability", label: "Availability" },
  { to: "/doctor/medical-records", label: "Medical Records" },
  { to: "/doctor/prescriptions", label: "Prescriptions" },
  { to: "/doctor/notifications", label: "Notifications" },
  { to: "/doctor/profile", label: "Profile" },
];

export default function DoctorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white sm:block">
        <div className="px-5 py-5">
          <p className="text-lg font-semibold text-clinic-700">
            Clinic<span className="text-slate-800">Care</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Doctor portal</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-clinic-50 text-clinic-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 px-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <motion.main
          className="mx-auto max-w-5xl px-4 py-8 sm:px-8"
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
