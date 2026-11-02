import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import { registerPatient, registerDoctor } from "../../services/authService.js";
import { ROLES } from "../../utils/constants.js";
import {
  isValidEmail,
  isNonEmpty,
  isValidPassword,
  passwordsMatch,
} from "../../utils/validators.js";
import { fadeInUp } from "../../components/animations/variants.js";

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === ROLES.DOCTOR ? ROLES.DOCTOR : ROLES.PATIENT;

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    qualification: "",
    experienceYears: "",
    consultationInfo: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const nextErrors = {};
    if (!isNonEmpty(form.fullName)) nextErrors.fullName = "Full name is required.";
    if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!isValidPassword(form.password)) nextErrors.password = "Use at least 8 characters.";
    if (!passwordsMatch(form.password, form.confirmPassword)) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (role === ROLES.DOCTOR) {
      if (!isNonEmpty(form.specialization)) {
        nextErrors.specialization = "Specialization is required for doctors.";
      }
      if (!isValidEmail(form.adminEmail)) {
        nextErrors.adminEmail = "Admin email is required.";
      }
      if (!isNonEmpty(form.adminPassword)) {
        nextErrors.adminPassword = "Admin password is required.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (role === ROLES.PATIENT) {
        await registerPatient({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        });
      } else {
        await registerDoctor({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          specialization: form.specialization.trim() || undefined,
          qualification: form.qualification.trim() || undefined,
          experience_years: form.experienceYears ? parseInt(form.experienceYears, 10) : undefined,
          consultation_info: form.consultationInfo.trim() || undefined,
          admin_email: form.adminEmail.trim(),
          admin_password: form.adminPassword,
        });
      }

      navigate("/login", {
        state: {
          registered: true,
          registeredRole: role,
          message: `Account created successfully! Please log in as a ${role}.`,
        },
      });
    } catch (err) {
      const serverDetail = err.response?.data?.detail;
      const message =
        typeof serverDetail === "string"
          ? serverDetail
          : Array.isArray(serverDetail) && serverDetail[0]?.msg
          ? serverDetail[0].msg
          : "We couldn't create your account. Please check your details and try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <h1 className="text-2xl font-semibold text-slate-900">
          Create a {role === ROLES.DOCTOR ? "doctor" : "patient"} account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === ROLES.DOCTOR
            ? "Register your medical practice to manage appointments and consultations."
            : "Register to book appointments and manage your care."}
        </p>

        {/* Role Switcher */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {[ROLES.PATIENT, ROLES.DOCTOR].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setFormError("");
                setErrors({});
              }}
              className={`rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                role === r ? "bg-white text-clinic-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {r} sign up
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="fullName"
            label="Full name"
            required
            value={form.fullName}
            onChange={updateField("fullName")}
            error={errors.fullName}
            placeholder={role === ROLES.DOCTOR ? "Dr. Jane Smith" : "Jane Doe"}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            id="phone"
            label="Phone number (optional)"
            type="tel"
            value={form.phone}
            onChange={updateField("phone")}
            placeholder="+1 (555) 000-0000"
          />

          {/* Doctor-specific fields */}
          {role === ROLES.DOCTOR && (
            <>
              <Input
                id="specialization"
                label="Specialization"
                required
                value={form.specialization}
                onChange={updateField("specialization")}
                error={errors.specialization}
                placeholder="e.g. Cardiology, Dermatology, General Practice"
              />
              <Input
                id="qualification"
                label="Qualification"
                value={form.qualification}
                onChange={updateField("qualification")}
                placeholder="e.g. MD, MBBS"
              />
              <Input
                id="experienceYears"
                label="Years of experience"
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={updateField("experienceYears")}
                placeholder="e.g. 8"
              />
              <Input
                id="consultationInfo"
                label="Consultation info"
                value={form.consultationInfo}
                onChange={updateField("consultationInfo")}
                placeholder="e.g. In-person & Video consultations"
              />

              <div className="rounded-lg border border-clinic-200 bg-clinic-50/50 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-clinic-800">
                    Admin Authorization Required
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Doctor registration requires administrator credentials for approval.
                  </p>
                </div>
                <Input
                  id="adminEmail"
                  label="Admin Email"
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={updateField("adminEmail")}
                  error={errors.adminEmail}
                  placeholder="admin@clinic.org"
                />
                <Input
                  id="adminPassword"
                  label="Admin Password"
                  type="password"
                  required
                  value={form.adminPassword}
                  onChange={updateField("adminPassword")}
                  error={errors.adminPassword}
                  placeholder="Enter admin password"
                />
              </div>
            </>
          )}

          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={updateField("password")}
            error={errors.password}
          />
          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            required
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            error={errors.confirmPassword}
          />

          {formError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : `Create ${role} account`}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-clinic-700 hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
