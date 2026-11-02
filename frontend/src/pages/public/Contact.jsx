import React from "react";
import Card from "../../components/Card.jsx";

export default function Contact() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Contact us</h1>
      <p className="mt-2 text-sm text-slate-600">
        Reach out with questions about appointments, services, or your visit.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Address</h2>
          <p className="mt-1.5 text-sm text-slate-500">123 Wellness Avenue, Your City</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Phone &amp; email</h2>
          <p className="mt-1.5 text-sm text-slate-500">+1 (555) 010-2030</p>
          <p className="text-sm text-slate-500">contact@cliniccare.example</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Working hours</h2>
          <p className="mt-1.5 text-sm text-slate-500">Mon – Sat: 9:00 AM – 7:00 PM</p>
          <p className="text-sm text-slate-500">Sunday: Closed</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Location</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Map embed placeholder — add a maps integration in a later phase.
          </p>
        </Card>
      </div>
    </section>
  );
}
