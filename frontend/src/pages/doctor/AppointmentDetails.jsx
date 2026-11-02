import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import Modal from "../../components/Modal.jsx";
import {
  getAppointmentDetails,
  updateAppointmentStatus,
  cancelAppointment,
} from "../../services/appointmentService.js";
import { getRecordByAppointment } from "../../services/doctorService.js";
import { APPOINTMENT_STATUS } from "../../utils/constants.js";

// Forward-only transitions matching the lifecycle.
const NEXT_STATUS = {
  [APPOINTMENT_STATUS.BOOKED]: APPOINTMENT_STATUS.CONFIRMED,
  [APPOINTMENT_STATUS.CONFIRMED]: APPOINTMENT_STATUS.IN_CONSULTATION,
  [APPOINTMENT_STATUS.IN_CONSULTATION]: APPOINTMENT_STATUS.COMPLETED,
};

const NEXT_LABEL = {
  [APPOINTMENT_STATUS.BOOKED]: "Confirm appointment",
  [APPOINTMENT_STATUS.CONFIRMED]: "Start consultation",
  [APPOINTMENT_STATUS.IN_CONSULTATION]: "Mark as completed",
};

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAppointmentDetails(appointmentId),
      getRecordByAppointment(appointmentId).catch(() => null),
    ])
      .then(([apptData, recData]) => {
        if (!isMounted) return;
        setAppointment(apptData);
        setMedicalRecord(recData);
      })
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  async function handleAdvanceStatus() {
    const next = NEXT_STATUS[appointment.status];
    if (!next) return;
    setIsUpdating(true);
    try {
      const updated = await updateAppointmentStatus(appointmentId, next);
      setAppointment(updated);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCancel() {
    setIsUpdating(true);
    try {
      const updated = await cancelAppointment(appointmentId);
      setAppointment(updated);
      setIsCancelOpen(false);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading appointment..." />;

  const nextAction = NEXT_STATUS[appointment?.status];
  const patientId = appointment?.patient_id || appointment?.patientId;
  const canCancel =
    appointment?.status !== APPOINTMENT_STATUS.COMPLETED &&
    appointment?.status !== APPOINTMENT_STATUS.CANCELLED;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-medium text-slate-500 hover:text-clinic-700"
      >
        ← Back
      </button>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {appointment?.counterpart_name || appointment?.counterpartName || "Patient"}
            </h1>
            <p className="text-sm text-slate-500">
              {appointment?.date} · {appointment?.time}
            </p>
          </div>
          <StatusBadge status={appointment?.status} />
        </div>

        {(appointment?.reason_for_visit || appointment?.reasonForVisit) && (
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Reason for visit: </span>
            {appointment?.reason_for_visit || appointment?.reasonForVisit}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {nextAction && (
            <Button variant="primary" onClick={handleAdvanceStatus} disabled={isUpdating}>
              {isUpdating ? "Updating..." : NEXT_LABEL[appointment.status]}
            </Button>
          )}

          {patientId && (
            <Link to={`/doctor/patients/${patientId}`}>
              <Button variant="secondary">View patient details</Button>
            </Link>
          )}

          {appointment?.status !== APPOINTMENT_STATUS.CANCELLED && (
            <Link to={`/doctor/appointments/${appointmentId}/consultation`}>
              <Button variant="secondary">
                {medicalRecord ? "Edit consultation notes" : "Open consultation"}
              </Button>
            </Link>
          )}

          {canCancel && (
            <Button variant="danger" onClick={() => setIsCancelOpen(true)} disabled={isUpdating}>
              Cancel appointment
            </Button>
          )}
        </div>
      </Card>

      {/* Consultation Record Details if available */}
      {medicalRecord && (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Consultation Summary</h2>
            <span className="text-xs text-slate-400">
              {medicalRecord.consultationDate || medicalRecord.consultation_date}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Symptoms</dt>
              <dd className="mt-0.5 text-slate-700">{medicalRecord.symptoms || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Diagnosis</dt>
              <dd className="mt-0.5 text-slate-700">{medicalRecord.diagnosis || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Treatment</dt>
              <dd className="mt-0.5 text-slate-700">{medicalRecord.treatment || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Follow-up Date</dt>
              <dd className="mt-0.5 text-slate-700">
                {medicalRecord.followUpDate || medicalRecord.follow_up_date || "—"}
              </dd>
            </div>
          </dl>
          {medicalRecord.notes && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium uppercase text-slate-400">Notes</p>
              <p className="mt-0.5 text-sm text-slate-600">{medicalRecord.notes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Doctor Cancel Modal */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Cancel appointment">
        <p className="text-sm text-slate-600">
          Are you sure you want to cancel this appointment with the patient? The patient will be notified.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>
            Keep appointment
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={isUpdating}>
            {isUpdating ? "Cancelling..." : "Yes, cancel appointment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
