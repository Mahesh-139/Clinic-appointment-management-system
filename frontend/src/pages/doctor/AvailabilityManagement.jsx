import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { getAvailability, setAvailability } from "../../services/doctorService.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX_MAP = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const INDEX_DAY_MAP = { 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun" };

export default function AvailabilityManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const [workingDays, setWorkingDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [newUnavailableDate, setNewUnavailableDate] = useState("");

  useEffect(() => {
    let isMounted = true;
    getAvailability()
      .then((data) => {
        if (!isMounted) return;
        if (data?.working_days && data.working_days.length > 0) {
          const days = data.working_days.map((w) => INDEX_DAY_MAP[w.day_of_week]).filter(Boolean);
          setWorkingDays(days);

          const first = data.working_days[0];
          if (first.start_time) setStartTime(first.start_time.slice(0, 5));
          if (first.end_time) setEndTime(first.end_time.slice(0, 5));
          if (first.break_start) setBreakStart(first.break_start.slice(0, 5));
          if (first.break_end) setBreakEnd(first.break_end.slice(0, 5));
          if (first.slot_duration_minutes) setSlotDuration(first.slot_duration_minutes);
        }
        if (data?.unavailable_dates) {
          setUnavailableDates(data.unavailable_dates);
        }
      })
      .catch(() => {
        // Fall back to defaults
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleDay(day) {
    setWorkingDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  }

  function addUnavailableDate() {
    if (!newUnavailableDate) return;
    setUnavailableDates((dates) => [...new Set([...dates, newUnavailableDate])]);
    setNewUnavailableDate("");
  }

  function removeUnavailableDate(date) {
    setUnavailableDates((dates) => dates.filter((d) => d !== date));
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const formatTime = (t) => {
        if (!t) return null;
        return t.length === 5 ? `${t}:00` : t;
      };

      const working_days = workingDays.map((day) => ({
        day_of_week: DAY_INDEX_MAP[day],
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        break_start: formatTime(breakStart),
        break_end: formatTime(breakEnd),
        slot_duration_minutes: parseInt(slotDuration, 10) || 30,
      }));

      await setAvailability({
        working_days,
        unavailable_dates: unavailableDates,
      });

      setSaveSuccess("Availability schedule updated successfully.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(detail || "Failed to update availability. Please check the values.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading availability..." />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Availability</h1>
      <p className="mt-1 text-sm text-slate-500">
        Patients can only book within these hours, outside breaks, and on working days.
      </p>

      {saveSuccess && (
        <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <Card className="mt-6 space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Working days</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  workingDays.includes(day)
                    ? "border-clinic-600 bg-clinic-50 text-clinic-700 font-semibold"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startTime"
            label="Working hours start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            id="endTime"
            label="Working hours end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="breakStart"
            label="Break start"
            type="time"
            value={breakStart}
            onChange={(e) => setBreakStart(e.target.value)}
          />
          <Input
            id="breakEnd"
            label="Break end"
            type="time"
            value={breakEnd}
            onChange={(e) => setBreakEnd(e.target.value)}
          />
        </div>

        <Input
          id="slotDuration"
          label="Appointment duration (minutes)"
          type="number"
          min="10"
          max="240"
          value={slotDuration}
          onChange={(e) => setSlotDuration(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Unavailable dates</p>
          <div className="flex gap-2">
            <Input
              id="newUnavailableDate"
              type="date"
              value={newUnavailableDate}
              onChange={(e) => setNewUnavailableDate(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={addUnavailableDate}>
              Add
            </Button>
          </div>
          {unavailableDates.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {unavailableDates.map((date) => (
                <li key={date} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md">
                  <span>{date}</span>
                  <button
                    type="button"
                    onClick={() => removeUnavailableDate(date)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save availability"}
        </Button>
      </Card>
    </div>
  );
}
