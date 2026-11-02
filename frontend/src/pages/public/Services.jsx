import React from "react";
import Card from "../../components/Card.jsx";

const SERVICES = [
  { title: "General Consultation", description: "Routine checkups and everyday health concerns." },
  { title: "Specialist Care", description: "Access to doctors across multiple specializations." },
  { title: "Follow-up Visits", description: "Continued care with the doctor who treated you." },
  { title: "Diagnostic Referrals", description: "Guidance on lab tests and diagnostics when needed." },
  { title: "Prescription Management", description: "Digital prescriptions you can access any time." },
  { title: "Health Records", description: "A running history of your consultations in one place." },
];

export default function Services() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Our services</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        A look at what ClinicCare offers. Availability varies by doctor and specialization.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Card key={service.title}>
            <h2 className="text-sm font-semibold text-slate-900">{service.title}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{service.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
