import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import { loginPatient, loginDoctor } from "../../services/authService.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../utils/constants.js";
import { fadeInUp } from "../../components/animations/variants.js";

/**
 * Single login page with an explicit Patient / Doctor choice, per the
 * auth architecture.
 */
export default function Login() {
  const location = useLocation();
  const initialRole = location.state?.registeredRole || ROLES.PATIENT;

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const request = role === ROLES.DOCTOR ? loginDoctor : loginPatient;
      const data = await request({ email: email.trim(), password });
      login(data.user, role, data.access_token);
      const redirectTo =
        location.state?.from?.pathname ||
        (role === ROLES.DOCTOR ? "/doctor/dashboard" : "/patient/dashboard");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : "We couldn't log you in with those details. Please check your credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">Choose your account type to continue.</p>

        {successMessage && (
          <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
            {successMessage}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {[ROLES.PATIENT, ROLES.DOCTOR].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setError("");
              }}
              className={`rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                role === r ? "bg-white text-clinic-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {r} login
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : `Log in as ${role}`}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {role === ROLES.PATIENT ? (
            <>
              New here?{" "}
              <Link to="/register?role=patient" className="font-medium text-clinic-700 hover:underline">
                Create a patient account
              </Link>
            </>
          ) : (
            <>
              New doctor?{" "}
              <Link to="/register?role=doctor" className="font-medium text-clinic-700 hover:underline">
                Register as a doctor
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </section>
  );
}
