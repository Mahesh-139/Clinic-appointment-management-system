import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import {
  createConsultationRecord,
  createPrescription,
} from "../../services/doctorService.js";

const EMPTY_MEDICINE = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

/**
 * Records a consultation (symptoms/diagnosis/treatment/notes/follow-up) and,
 * optionally, a prescription for the same visit. Two related resources are
 * created together here for a smoother doctor workflow, but they remain
 * separate tables/endpoints on the backend (medical_records, prescriptions).
 */
export default function Consultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState({
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    followUpDate: "",
  });
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);
  const [isSaving, setIsSaving] = useState(false);

  function updateRecordField(field) {
    return (e) => setRecord((r) => ({ ...r, [field]: e.target.value }));
  }

  function updateMedicine(index, field, value) {
    setMedicines((meds) =>
      meds.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  }

  function addMedicine() {
    setMedicines((meds) => [...meds, { ...EMPTY_MEDICINE }]);
  }

  function removeMedicine(index) {
    setMedicines((meds) => meds.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await createConsultationRecord(appointmentId, record);

      const validMedicines = medicines.filter((m) => m.name.trim());
      if (validMedicines.length > 0) {
        await createPrescription(appointmentId, { medicines: validMedicines });
      }

      navigate(`/doctor/appointments/${appointmentId}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Consultation</h1>
      <p className="mt-1 text-sm text-slate-500">
        Record the visit details. This becomes part of the patient's medical history.
      </p>

      <Card className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Consultation notes</h2>
        <Input
          id="symptoms"
          label="Symptoms"
          value={record.symptoms}
          onChange={updateRecordField("symptoms")}
        />
        <Input
          id="diagnosis"
          label="Diagnosis"
          value={record.diagnosis}
          onChange={updateRecordField("diagnosis")}
        />
        <Input
          id="treatment"
          label="Treatment"
          value={record.treatment}
          onChange={updateRecordField("treatment")}
        />
        <Input
          id="notes"
          label="Additional notes"
          value={record.notes}
          onChange={updateRecordField("notes")}
        />
        <Input
          id="followUpDate"
          label="Follow-up date (optional)"
          type="date"
          value={record.followUpDate}
          onChange={updateRecordField("followUpDate")}
        />
      </Card>

      <Card className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Prescription (optional)</h2>
          <Button type="button" variant="ghost" onClick={addMedicine}>
            + Add medicine
          </Button>
        </div>

        {medicines.map((med, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase text-slate-400">Medicine {index + 1}</p>
              {medicines.length > 1 && (
                <button
                  onClick={() => removeMedicine(index)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                id={`med-name-${index}`}
                label="Medicine name"
                value={med.name}
                onChange={(e) => updateMedicine(index, "name", e.target.value)}
              />
              <Input
                id={`med-dosage-${index}`}
                label="Dosage"
                value={med.dosage}
                onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
              />
              <Input
                id={`med-frequency-${index}`}
                label="Frequency"
                value={med.frequency}
                onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
              />
              <Input
                id={`med-duration-${index}`}
                label="Duration"
                value={med.duration}
                onChange={(e) => updateMedicine(index, "duration", e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Input
                id={`med-instructions-${index}`}
                label="Instructions (optional)"
                value={med.instructions}
                onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
              />
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-6">
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save consultation"}
        </Button>
      </div>
    </div>
  );
}
