import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { getMyPrescriptionFiles } from "../../services/patientService.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return "📄";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "🖼️";
  return "📎";
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getMyPrescriptionFiles()
      .then((data) => {
        if (!isMounted) return;
        setPrescriptions(data || []);
        setStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => {
        if (isMounted) setStatus("empty");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Prescriptions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Prescription files uploaded to your account by your doctors.
      </p>

      <div className="mt-6 space-y-4">
        {status === "loading" && <LoadingState />}
        {status === "empty" && (
          <EmptyState
            title="No prescriptions yet"
            description="Prescriptions uploaded by your doctor will appear here."
          />
        )}
        {status === "success" &&
          prescriptions.map((rx) => (
            <Card key={rx.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0" aria-hidden="true">
                    {fileIcon(rx.original_filename)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {rx.original_filename}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From Dr. {rx.doctor_name || "your doctor"}
                    </p>
                    {rx.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic">{rx.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{rx.issued_date}</p>
                  <a
                    href={`${API_BASE}${rx.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline"
                  >
                    View / Download ↗
                  </a>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
