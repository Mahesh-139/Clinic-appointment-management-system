import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { getAvailableSlots, bookAppointment } from "../../services/appointmentService.js";

/**
 * Date -> slot -> confirm flow. Slot validity is only ever authoritative
 * on the backend (see backend/app/services/availability_service.py);
 * this page just reflects what the server returns and re-validates on
 * submit, since the slot list can go stale between fetch and booking.
 */
export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsStatus, setSlotsStatus] = useState("idle"); // idle | loading | success | empty | error
  const [reason, setReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (!date) return;
    let isMounted = true;
    setSlotsStatus("loading");
    setSelectedSlot(null);
    getAvailableSlots(doctorId, date)
      .then((data) => {
        if (!isMounted) return;
        const normalizedSlots =
          data?.all_slots && data.all_slots.length > 0
            ? data.all_slots
            : (data?.slots || (Array.isArray(data) ? data : [])).map((s) => ({
                time: typeof s === "string" ? s.slice(0, 5) : String(s),
                available: true,
              }));
        setSlots(normalizedSlots);
        setSlotsStatus(normalizedSlots.length ? "success" : "empty");
      })
      .catch(() => isMounted && setSlotsStatus("error"));
    return () => {
      isMounted = false;
    };
  }, [doctorId, date]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setIsBooking(true);
    setBookingError("");
    try {
      const formattedSlot = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot;
      const appointment = await bookAppointment({
        doctorId,
        date,
        slot: formattedSlot,
        reasonForVisit: reason,
      });
      navigate(`/patient/appointments/confirmation/${appointment.id}`);
    } catch (err) {
      // The backend rejects the request if the slot was taken in the
      // meantime — surface that clearly rather than a generic message.
      setBookingError(
        err.response?.data?.detail || "That slot is no longer available. Please choose a different time."
      );
      setSlotsStatus("loading");
      getAvailableSlots(doctorId, date).then((data) => {
        const normalizedSlots =
          data?.all_slots && data.all_slots.length > 0
            ? data.all_slots
            : (data?.slots || (Array.isArray(data) ? data : [])).map((s) => ({
                time: typeof s === "string" ? s.slice(0, 5) : String(s),
                available: true,
              }));
        setSlots(normalizedSlots);
        setSlotsStatus(normalizedSlots.length ? "success" : "empty");
      });
    } finally {
      setIsBooking(false);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Book an appointment</h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose a date and an available time slot to schedule your consultation.
      </p>

      <Card className="mt-6">
        <Input
          id="appointment-date"
          label="Select a date"
          type="date"
          min={todayStr}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {date && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Available time slots</p>
              <span className="text-xs text-slate-400">
                Disabled slots are booked/unavailable
              </span>
            </div>
            {slotsStatus === "loading" && <LoadingState label="Checking availability..." />}
            {slotsStatus === "empty" && (
              <EmptyState title="No slots available" description="The doctor is not available on this date. Please try another day." />
            )}
            {slotsStatus === "error" && (
              <p className="text-sm text-red-600">Couldn't load availability. Try again.</p>
            )}
            {slotsStatus === "success" && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slotObj) => (
                  <button
                    key={slotObj.time}
                    type="button"
                    disabled={!slotObj.available}
                    onClick={() => slotObj.available && setSelectedSlot(slotObj.time)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      !slotObj.available
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        : selectedSlot === slotObj.time
                        ? "border-clinic-600 bg-clinic-50 text-clinic-700 ring-2 ring-clinic-500 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-clinic-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{slotObj.time}</span>
                    {!slotObj.available && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Booked
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedSlot && (
          <div className="mt-5">
            <Input
              id="reason"
              label="Reason for visit (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {bookingError && <p className="mt-3 text-sm text-red-600">{bookingError}</p>}

        <div className="mt-6">
          <Button
            variant="primary"
            disabled={!selectedSlot || isBooking}
            onClick={handleConfirm}
          >
            {isBooking ? "Booking..." : "Confirm appointment"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
