import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import { fadeInUp, staggerChildren } from "../../components/animations/variants.js";

const SERVICES_PREVIEW = [
  { title: "General Consultation", description: "Routine checkups and everyday health concerns." },
  { title: "Specialist Care", description: "Access doctors across multiple specializations." },
  { title: "Follow-up Visits", description: "Continued care with the doctor who treated you." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="max-w-2xl"
        >
          <motion.h1 variants={fadeInUp} className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Book a doctor's appointment in minutes.
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-4 text-base text-slate-600 sm:text-lg">
            ClinicCare connects you with our doctors, lets you find a slot that fits your
            schedule, and keeps your records and prescriptions in one place.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button variant="primary">Book an appointment</Button>
            </Link>
            <Link to="/doctors">
              <Button variant="secondary">Browse doctors</Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Services overview */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900">What we offer</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {SERVICES_PREVIEW.map((service) => (
              <Card key={service.title}>
                <h3 className="text-sm font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{service.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/services" className="text-sm font-medium text-clinic-700 hover:underline">
              View all services
            </Link>
          </div>
        </div>
      </section>

      {/* Doctor introduction */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900">Meet our doctors</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Qualified doctors across specializations, with clear availability so you know
            exactly when you can be seen.
          </p>
          <div className="mt-6">
            <Link to="/doctors">
              <Button variant="secondary">View all doctors</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Basic clinic info */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <h3 className="text-sm font-semibold text-slate-900">Working hours</h3>
              <p className="mt-1.5 text-sm text-slate-500">Mon – Sat: 9:00 AM – 7:00 PM</p>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-slate-900">Location</h3>
              <p className="mt-1.5 text-sm text-slate-500">See the Contact page for directions.</p>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-slate-900">Support</h3>
              <p className="mt-1.5 text-sm text-slate-500">Reach us any time via the Contact page.</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
