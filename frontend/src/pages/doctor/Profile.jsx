import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import {
  getDoctorOwnProfile,
  updateDoctorProfile,
  uploadDoctorPhoto,
} from "../../services/doctorService.js";
import { deleteMyAccount } from "../../services/authService.js";
import { useAuth } from "../../hooks/useAuth.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience_years: "",
    consultation_info: "",
    photo_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");

  // Account deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadProfile = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const data = await getDoctorOwnProfile();
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        specialization: data.specialization || "",
        qualification: data.qualification || "",
        experience_years: data.experience_years ?? "",
        consultation_info: data.consultation_info || "",
        photo_url: data.photo_url || "",
      });
    } catch (err) {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(field) {
    return (e) => {
      setSaveSuccess("");
      setSaveError("");
      setProfile((p) => ({ ...p, [field]: e.target.value }));
    };
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const payload = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim() || null,
        specialization: profile.specialization.trim() || null,
        qualification: profile.qualification.trim() || null,
        experience_years:
          profile.experience_years !== "" && profile.experience_years !== null
            ? parseInt(profile.experience_years, 10)
            : null,
        consultation_info: profile.consultation_info.trim() || null,
        photo_url: profile.photo_url.trim() || null,
      };

      const updated = await updateDoctorProfile(payload);
      setProfile({
        full_name: updated.full_name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        specialization: updated.specialization || "",
        qualification: updated.qualification || "",
        experience_years: updated.experience_years ?? "",
        consultation_info: updated.consultation_info || "",
        photo_url: updated.photo_url || "",
      });
      setSaveSuccess("Your profile has been saved successfully. Updated details are now active in doctor discovery.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(detail || "We couldn't save your profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Photo upload ──

  function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Please select a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be under 5 MB.");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    handlePhotoUpload(file);
  }

  async function handlePhotoUpload(file) {
    setIsUploadingPhoto(true);
    setPhotoError("");
    try {
      const result = await uploadDoctorPhoto(file);
      setProfile((p) => ({ ...p, photo_url: result.photo_url || "" }));
      setSaveSuccess("Profile photo updated.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPhotoError(detail || "Failed to upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  // ── Account deletion ──

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteMyAccount();
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setDeleteError(detail || "Could not delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  const currentPhoto = photoPreview || (profile.photo_url
    ? (profile.photo_url.startsWith("http") ? profile.photo_url : `${API_BASE}${profile.photo_url}`)
    : null);

  if (isLoading) return <LoadingState label="Loading profile..." />;
  if (fetchError) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
        <div className="mt-6">
          <ErrorState
            title="Failed to load profile"
            description="We encountered an issue fetching your details from the server."
            onRetry={loadProfile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Professional details shown to patients across the clinic directory.
      </p>

      {saveSuccess && (
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {saveError}
        </div>
      )}

      {/* ── Profile photo section ── */}
      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Profile photo</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl text-slate-400 font-semibold select-none">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "D"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingPhoto ? "Uploading…" : "Change photo"}
            </Button>
            <p className="mt-1 text-xs text-slate-400">JPG, PNG or WEBP · max 5 MB</p>
            {photoError && (
              <p className="mt-1 text-xs text-red-600">{photoError}</p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Profile form ── */}
      <Card className="mt-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="full_name"
            label="Full name"
            required
            value={profile.full_name}
            onChange={updateField("full_name")}
          />
          <Input
            id="email"
            label="Email address"
            type="email"
            disabled
            value={profile.email}
            className="input-field bg-slate-100 text-slate-500 cursor-not-allowed"
          />
          <Input
            id="phone"
            label="Phone number"
            type="tel"
            value={profile.phone}
            onChange={updateField("phone")}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            id="specialization"
            label="Specialization"
            required
            value={profile.specialization}
            onChange={updateField("specialization")}
            placeholder="e.g. Cardiology, Dermatology"
          />
          <Input
            id="qualification"
            label="Qualification"
            value={profile.qualification}
            onChange={updateField("qualification")}
            placeholder="e.g. MD, MBBS, FACC"
          />
          <Input
            id="experience_years"
            label="Years of experience"
            type="number"
            min="0"
            value={profile.experience_years}
            onChange={updateField("experience_years")}
            placeholder="e.g. 10"
          />
          <Input
            id="consultation_info"
            label="Consultation info"
            value={profile.consultation_info}
            onChange={updateField("consultation_info")}
            placeholder="e.g. In-person & Video consultations"
          />

          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      {/* ── Danger zone: account deletion ── */}
      <Card className="mt-4 border border-red-200">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-xs text-slate-500 mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setShowDeleteConfirm(true);
              setDeleteError("");
              setDeleteConfirmText("");
            }}
          >
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Type <strong>DELETE</strong> to confirm permanent deletion of your account.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {deleteError && (
              <p className="text-xs text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="danger"
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Deleting…" : "Confirm deletion"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
