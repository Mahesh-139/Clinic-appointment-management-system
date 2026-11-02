import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-clinic-700">
              Clinic<span className="text-slate-800">Care</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Book appointments, manage your care, and stay connected with your doctor —
              all in one place.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Clinic</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/about" className="hover:text-clinic-700">About</Link></li>
              <li><Link to="/services" className="hover:text-clinic-700">Services</Link></li>
              <li><Link to="/doctors" className="hover:text-clinic-700">Doctors</Link></li>
              <li><Link to="/contact" className="hover:text-clinic-700">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Working hours</h4>
            <p className="mt-3 text-sm text-slate-500">Mon – Sat: 9:00 AM – 7:00 PM</p>
            <p className="text-sm text-slate-500">Sunday: Closed</p>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} ClinicCare. Built as an academic project.
        </p>
      </div>
    </footer>
  );
}
