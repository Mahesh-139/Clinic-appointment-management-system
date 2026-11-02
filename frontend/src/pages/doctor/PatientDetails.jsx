import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import {
  getPatientDetails,
  getPatientAppointmentHistory,
  getPatientMedicalHistory,
} from "../../services/doctorService.js";

/**
 * Read-only view for a doctor. Shows the patient details, appointment history,
 * and consultation/medical record history for appointments this doctor had with
 * the patient — strictly enforced on the backend.
 */
export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPatientDetails(patientId),
      getPatientAppointmentHistory(patientId),
      getPatientMedicalHistory(patientId),
    ])
      .then(([patientData, historyData, medData]) => {
        if (!isMounted) return;
        setPatient(patientData);
        setHistory(historyData || []);
        setMedicalRecords(medData || []);
        setStatus("success");
      })
      .catch(() => isMounted && setStatus("error"));
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  if (status === "loading") return <LoadingState label="Loading patient details..." />;

  const fullName = patient?.full_name || patient?.fullName || "Patient";
  const email = patient?.email || "—";
  const phone = patient?.phone || "—";
  const dob = patient?.date_of_birth || patient?.dateOfBirth;
  const gender = patient?.gender || "—";
  const address = patient?.address || "—";

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm font-medium text-slate-500 hover:text-clinic-700 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Patient Profile Card */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-clinic-100 text-clinic-700 font-bold text-xl flex items-center justify-center">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
            <p className="text-sm text-slate-500">Patient ID: {patientId}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-slate-100 pt-4">
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase">Email</dt>
            <dd className="text-slate-800 font-medium">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase">Phone</dt>
            <dd className="text-slate-800 font-medium">{phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase">Gender</dt>
            <dd className="text-slate-800 font-medium capitalize">{gender}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase">Date of Birth</dt>
            <dd className="text-slate-800 font-medium">{dob ? String(dob) : "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-400 uppercase">Address</dt>
            <dd className="text-slate-800">{address}</dd>
          </div>
        </dl>
      </Card>

      {/* Medical Records / Consultation History */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Consultation & Medical History</h2>
        {medicalRecords.length === 0 ? (
          <EmptyState
            title="No medical records"
            description="No recorded consultations or clinical notes for this patient yet."
          />
        ) : (
          <div className="space-y-3">
            {medicalRecords.map((rec) => {
              const recDate = rec.consultation_date || rec.consultationDate || rec.created_at || rec.createdAt;
              const followUp = rec.follow_up_date || rec.followUpDate;
              return (
                <Card key={rec.id} className="border-l-4 border-l-clinic-600">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-clinic-700 uppercase tracking-wide">
                        Consultation
                      </span>
                      <p className="text-sm font-medium text-slate-700">
                        Date: {recDate ? String(recDate).slice(0, 10) : "—"}
                      </p>
                    </div>
                    {followUp && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Follow-up: {String(followUp).slice(0, 10)}
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {rec.diagnosis && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-slate-400">Diagnosis</dt>
                        <dd className="text-slate-800 font-semibold">{rec.diagnosis}</dd>
                      </div>
                    )}
                    {rec.symptoms && (
                      <div>
                        <dt className="text-xs font-medium text-slate-400">Symptoms</dt>
                        <dd className="text-slate-700">{rec.symptoms}</dd>
                      </div>
                    )}
                    {rec.treatment && (
                      <div>
                        <dt className="text-xs font-medium text-slate-400">Treatment Plan</dt>
                        <dd className="text-slate-700">{rec.treatment}</dd>
                      </div>
                    )}
                    {rec.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-slate-400">Clinical Notes</dt>
                        <dd className="text-slate-600 bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed">
                          {rec.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointment History */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Appointment History</h2>
        {history.length === 0 ? (
          <EmptyState
            title="No prior appointments"
            description="This is their first visit with you."
          />
        ) : (
          <div className="space-y-2">
            {history.map((appt) => {
              const apptDate = appt.appointment_date || appt.appointmentDate || appt.date;
              const apptTime = appt.appointment_time || appt.appointmentTime || appt.time;
              const reason = appt.reason_for_visit || appt.reasonForVisit;
              return (
                <Card
                  key={appt.id}
                  className="flex items-center justify-between cursor-pointer hover:border-clinic-300 transition-colors"
                  onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {apptDate ? String(apptDate) : "—"} · {apptTime ? String(apptTime).slice(0, 5) : "—"}
                    </p>
                    {reason && (
                      <p className="text-xs text-slate-500 mt-0.5">Reason: {reason}</p>
                    )}
                  </div>
                  <StatusBadge status={appt.status} />
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
