import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input.jsx";
import DoctorCard from "../../components/DoctorCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { searchDoctors } from "../../services/doctorService.js";

const SPECIALIZATIONS = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology",
];

const DAYS = [
  { value: "", label: "Any day" },
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];

export default function FindDoctors() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [availableDay, setAvailableDay] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState("loading");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      let isMounted = true;
      setStatus("loading");
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (specialization.trim()) params.specialization = specialization.trim();
      if (sortBy) params.sort_by = sortBy;
      if (availableDay !== "") params.available_day = parseInt(availableDay, 10);

      searchDoctors(params)
        .then((data) => {
          if (!isMounted) return;
          setDoctors(data || []);
          setStatus((data || []).length ? "success" : "empty");
        })
        .catch(() => isMounted && setStatus("error"));
      return () => {
        isMounted = false;
      };
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, specialization, sortBy, availableDay]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Find a doctor</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search by name, filter by specialty, sort by experience, or find doctors by day of week.
      </p>

      {/* Filter Controls */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Name</label>
          <Input
            id="find-doctor-search"
            placeholder="Dr. John..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Specialization</label>
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-clinic-500 focus:outline-none focus:ring-1 focus:ring-clinic-500"
          >
            <option value="">All specializations</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-clinic-500 focus:outline-none focus:ring-1 focus:ring-clinic-500"
          >
            <option value="">Default order</option>
            <option value="experience_desc">Experience: High to Low</option>
            <option value="experience_asc">Experience: Low to High</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Available Day</label>
          <select
            value={availableDay}
            onChange={(e) => setAvailableDay(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-clinic-500 focus:outline-none focus:ring-1 focus:ring-clinic-500"
          >
            {DAYS.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {status === "loading" && <LoadingState label="Loading doctors..." />}
        {status === "error" && (
          <ErrorState onRetry={() => setQuery((q) => q)} />
        )}
        {status === "empty" && (
          <EmptyState
            title="No doctors found"
            description="Try adjusting your search criteria, specialty, or schedule day."
          />
        )}
        {status === "success" &&
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewProfile={() => navigate(`/patient/doctors/${doctor.id}`)}
            />
          ))}
      </div>
    </div>
  );
}
