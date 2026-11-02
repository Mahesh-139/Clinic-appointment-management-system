import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { getDoctorProfile } from "../../services/doctorService.js";

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getDoctorProfile(doctorId)
      .then((data) => {
        if (!isMounted) return;
        setDoctor(data);
        setStatus("success");
      })
      .catch(() => isMounted && setStatus("error"));
    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  if (status === "loading") return <LoadingState label="Loading doctor profile..." />;
  if (status === "error") return <ErrorState onRetry={() => setStatus("loading")} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-clinic-600 hover:underline"
      >
        ← Back to doctors
      </button>

      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-clinic-100">
            {doctor?.photo_url ? (
              <img src={doctor.photo_url} alt={doctor.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-clinic-700">
                {doctor?.full_name?.charAt(0) || "D"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{doctor?.full_name || "Doctor"}</h1>
            <p className="text-sm text-slate-500">{doctor?.specialization || "Specialization"}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Qualification</dt>
            <dd className="text-slate-700">{doctor?.qualification || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Experience</dt>
            <dd className="text-slate-700">{doctor?.experience_years ?? "—"} years</dd>
          </div>
          <div>
            <dt className="text-slate-400">Consultation</dt>
            <dd className="text-slate-700">{doctor?.consultation_info || "In-clinic"}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <p className="text-sm text-slate-500 mb-3">
            Log in as a patient to book an appointment with this doctor.
          </p>
          <Link to="/login">
            <Button variant="primary">Log in to book</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
