import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorCard from "../../components/DoctorCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Input from "../../components/Input.jsx";
import { searchDoctors } from "../../services/doctorService.js";

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

/**
 * Public doctor directory with database-backed search and specialization filtering.
 */
export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [availableDay, setAvailableDay] = useState("");
  const [status, setStatus] = useState("loading"); // loading | success | empty | error

  const fetchDoctors = async () => {
    setStatus("loading");
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (specialization.trim()) params.specialization = specialization.trim();
      if (sortBy) params.sort_by = sortBy;
      if (availableDay !== "") params.available_day = parseInt(availableDay, 10);

      const data = await searchDoctors(params);
      setDoctors(data || []);
      setStatus((data || []).length ? "success" : "empty");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 250);

    return () => clearTimeout(timer);
  }, [query, specialization, sortBy, availableDay]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Find a doctor</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        Browse qualified doctors, search by name, or filter by medical specialization and schedule.
      </p>

      {/* Search & Filter Controls */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Name</label>
          <Input
            id="doctor-search"
            placeholder="Dr. John..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Specialization</label>
          <Input
            id="doctor-specialization"
            placeholder="Cardiology, Dermatology..."
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
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

      <div className="mt-8 space-y-4">
        {status === "loading" && <LoadingState label="Loading doctors..." />}
        {status === "error" && (
          <ErrorState
            title="Failed to load doctors"
            description="We couldn't retrieve the doctor directory from the server. Please try again."
            onRetry={fetchDoctors}
          />
        )}
        {status === "empty" && (
          <EmptyState
            title="No doctors found"
            description={
              query || specialization || availableDay !== ""
                ? "No doctors matched your search criteria. Try adjusting name, specialty, or day."
                : "No active doctor profiles are registered in the clinic directory yet."
            }
          />
        )}
        {status === "success" &&
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewProfile={() => navigate(`/doctors/${doctor.id}`)}
            />
          ))}
      </div>
    </section>
  );
}
