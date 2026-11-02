import React from "react";
import Card from "../../components/Card.jsx";

export default function About() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">About ClinicCare</h1>
      <p className="mt-3 text-sm text-slate-600">
        ClinicCare is committed to making quality healthcare simple to access — from
        finding the right doctor to booking a visit and following up on your care.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Our mission</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            To give every patient a clear, straightforward way to manage their
            appointments and medical care.
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Facilities</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            General consultation rooms, specialist clinics, and a dedicated
            follow-up care program.
          </p>
        </Card>
      </div>
    </section>
  );
}
