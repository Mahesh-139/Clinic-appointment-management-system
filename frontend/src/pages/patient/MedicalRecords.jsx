import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { getMedicalRecords } from "../../services/patientService.js";

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getMedicalRecords()
      .then((data) => {
        if (!isMounted) return;
        setRecords(data || []);
        setStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => isMounted && setStatus("empty"));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Medical records</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consultation history recorded by your doctors. Only visible to you.
      </p>

      <div className="mt-6 space-y-4">
        {status === "loading" && <LoadingState />}
        {status === "empty" && (
          <EmptyState
            title="No medical records yet"
            description="Records will appear here after your first consultation."
          />
        )}
        {status === "success" &&
          records.map((record) => (
            <Card key={record.id}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  {record.doctorName || record.doctor_name || "Doctor Consultation"} · {record.consultationDate || record.consultation_date}
                </h2>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Symptoms</dt>
                  <dd className="text-slate-700">{record.symptoms || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Diagnosis</dt>
                  <dd className="text-slate-700">{record.diagnosis || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Treatment</dt>
                  <dd className="text-slate-700">{record.treatment || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Follow-up</dt>
                  <dd className="text-slate-700">{record.followUpDate || record.follow_up_date || "—"}</dd>
                </div>
              </dl>
              {record.notes && (
                <p className="mt-3 text-sm text-slate-500">{record.notes}</p>
              )}
            </Card>
          ))}
      </div>
    </div>
  );
}
