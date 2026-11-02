import React, { useCallback, useEffect, useRef, useState } from "react";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import {
  searchPatientsForPrescription,
  uploadPrescriptionFileToPatient,
  getDoctorIssuedPrescriptionFiles,
} from "../../services/doctorService.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Prescriptions() {
  // ── Patient search state ──
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef(null);

  // ── Selected patient + upload form ──
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // ── Issued prescriptions list ──
  const [issued, setIssued] = useState([]);
  const [issuedStatus, setIssuedStatus] = useState("loading");

  const loadIssued = useCallback(() => {
    setIssuedStatus("loading");
    getDoctorIssuedPrescriptionFiles()
      .then((data) => {
        setIssued(data || []);
        setIssuedStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => setIssuedStatus("empty"));
  }, []);

  useEffect(() => {
    loadIssued();
  }, [loadIssued]);

  // ── Debounced patient search ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setPatients([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPatientsForPrescription(query.trim());
        setPatients(results || []);
      } catch {
        setPatients([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError("");
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      setFileError("Only PDF, JPG, PNG, or WEBP files are allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError("File must be under 10 MB.");
      return;
    }
    setFile(f);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedPatient || !file) return;
    setIsUploading(true);
    setUploadSuccess("");
    setUploadError("");
    try {
      await uploadPrescriptionFileToPatient(selectedPatient.id, file, notes.trim() || undefined);
      setUploadSuccess(`Prescription uploaded for ${selectedPatient.full_name}.`);
      setFile(null);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadIssued();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setUploadError(detail || "Failed to upload prescription. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Prescriptions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload prescription files (PDF or image) directly to a patient's account.
      </p>

      {/* ── Step 1: Find a patient ── */}
      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Step 1 — Find a patient
        </h2>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedPatient(null);
            setUploadSuccess("");
            setUploadError("");
          }}
          placeholder="Search by name or email…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {isSearching && (
          <p className="mt-2 text-xs text-slate-400">Searching…</p>
        )}
        {!isSearching && patients.length > 0 && !selectedPatient && (
          <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200 overflow-hidden">
            {patients.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
                  onClick={() => {
                    setSelectedPatient(p);
                    setQuery(p.full_name);
                    setPatients([]);
                  }}
                >
                  <span className="font-medium text-slate-800">{p.full_name}</span>
                  <span className="ml-2 text-slate-400">{p.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isSearching && query.trim().length >= 2 && patients.length === 0 && !selectedPatient && (
          <p className="mt-2 text-xs text-slate-400">No patients found.</p>
        )}
        {selectedPatient && (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-indigo-50 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
              {selectedPatient.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{selectedPatient.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{selectedPatient.email}</p>
            </div>
            <button
              type="button"
              className="text-xs text-indigo-600 hover:underline shrink-0"
              onClick={() => {
                setSelectedPatient(null);
                setQuery("");
                setFile(null);
                setNotes("");
                setUploadSuccess("");
                setUploadError("");
              }}
            >
              Change
            </button>
          </div>
        )}
      </Card>

      {/* ── Step 2: Upload file ── */}
      {selectedPatient && (
        <Card className="mt-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Step 2 — Upload prescription for{" "}
            <span className="text-indigo-600">{selectedPatient.full_name}</span>
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prescription file <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG or WEBP · max 10 MB</p>
              {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
              {file && !fileError && (
                <p className="mt-1 text-xs text-emerald-600">Selected: {file.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Take after meals, follow up in 2 weeks"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {uploadSuccess && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                {uploadSuccess}
              </div>
            )}
            {uploadError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {uploadError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={!file || !!fileError || isUploading}
            >
              {isUploading ? "Uploading…" : "Upload prescription"}
            </Button>
          </form>
        </Card>
      )}

      {/* ── Issued prescriptions history ── */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Prescriptions you've issued
        </h2>
        {issuedStatus === "loading" && <LoadingState />}
        {issuedStatus === "empty" && (
          <EmptyState
            title="No prescriptions issued yet"
            description="Upload your first prescription above."
          />
        )}
        {issuedStatus === "success" && (
          <div className="space-y-3">
            {issued.map((rx) => (
              <Card key={rx.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {rx.patient_name || "Unknown patient"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{rx.original_filename}</p>
                    {rx.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic">{rx.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{rx.issued_date}</p>
                    <a
                      href={`${API_BASE}${rx.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
                    >
                      View file ↗
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
