import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import Button from "./Button.jsx";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-clinic-700">
          Clinic<span className="text-slate-800">Care</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {!isAuthenticated &&
            PUBLIC_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? "text-clinic-700" : "text-slate-600 hover:text-clinic-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

          {isAuthenticated && (
            <NavLink
              to={dashboardPath}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "text-clinic-700" : "text-slate-600 hover:text-clinic-700"
                }`
              }
            >
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-clinic-700">
                Log in
              </Link>
              <Link to="/register">
                <Button variant="primary">Book an appointment</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="text-slate-600 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="text-2xl leading-none">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {!isAuthenticated &&
                PUBLIC_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-clinic-50"
                  >
                    {link.label}
                  </Link>
                ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-clinic-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-clinic-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-clinic-50"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-2 text-sm font-medium text-clinic-700 hover:bg-clinic-50"
                  >
                    Book an appointment
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
