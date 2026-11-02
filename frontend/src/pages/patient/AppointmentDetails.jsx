import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import Modal from "../../components/Modal.jsx";
import Input from "../../components/Input.jsx";
import {
  getAppointmentDetails,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
} from "../../services/appointmentService.js";
import { getRecordByAppointment } from "../../services/patientService.js";
import { APPOINTMENT_STATUS } from "../../utils/constants.js";

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleCancel() {
    setIsSubmitting(true);
    try {
      const updated = await cancelAppointment(appointmentId);
      setAppointment(updated);
      setIsCancelOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadSlotsForDate(date) {
    setNewDate(date);
    setSelectedSlot(null);
    if (!date) return;
    const docId = appointment?.doctor_id || appointment?.doctorId;
    const data = await getAvailableSlots(docId, date);
    const normalized = (data?.all_slots || data?.slots || data || [])
      .map((s) => (typeof s === "object" ? s.time : typeof s === "string" ? s.slice(0, 5) : s));
    setSlots(normalized);
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const formattedSlot = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot;
      const updated = await rescheduleAppointment(appointmentId, {
        date: newDate,
        slot: formattedSlot,
      });
      setAppointment(updated);
      setIsRescheduleOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading appointment..." />;

  const canModify =
    appointment?.status === APPOINTMENT_STATUS.BOOKED ||
    appointment?.status === APPOINTMENT_STATUS.CONFIRMED;

  return (
    <div className="max-w-xl">
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
              {appointment?.counterpart_name || appointment?.counterpartName || "Appointment"}
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

        {canModify && (
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setIsRescheduleOpen(true)}>
              Reschedule
            </Button>
            <Button variant="danger" onClick={() => setIsCancelOpen(true)}>
              Cancel appointment
            </Button>
          </div>
        )}
      </Card>

      {/* Completed Consultation Information */}
      {medicalRecord && (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Consultation Notes & Diagnosis</h2>
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
              <dt className="text-xs font-medium uppercase text-slate-400">Treatment Plan</dt>
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
              <p className="text-xs font-medium uppercase text-slate-400">Doctor's Advice</p>
              <p className="mt-0.5 text-sm text-slate-600">{medicalRecord.notes}</p>
            </div>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
            <Link to="/patient/medical-records" className="text-xs font-medium text-clinic-700 hover:underline">
              View all medical records →
            </Link>
            <Link to="/patient/prescriptions" className="text-xs font-medium text-clinic-700 hover:underline">
              Check prescriptions →
            </Link>
          </div>
        </Card>
      )}

      {/* Patient Cancel Modal */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Cancel appointment">
        <p className="text-sm text-slate-600">
          Are you sure you want to cancel this appointment? This can't be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>
            Keep appointment
          </Button>
          <Button variant="danger" disabled={isSubmitting} onClick={handleCancel}>
            {isSubmitting ? "Cancelling..." : "Yes, cancel it"}
          </Button>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule appointment"
      >
        <Input
          id="reschedule-date"
          label="New date"
          type="date"
          value={newDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => loadSlotsForDate(e.target.value)}
        />
        {slots.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  selectedSlot === slot
                    ? "border-clinic-600 bg-clinic-50 text-clinic-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleReschedule}
          >
            {isSubmitting ? "Rescheduling..." : "Confirm new time"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
