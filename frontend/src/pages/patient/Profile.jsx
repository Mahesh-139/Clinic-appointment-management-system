import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card.jsx";
import Input from "../../components/Input.jsx";
import Button from "../../components/Button.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { getPatientProfile, updatePatientProfile, uploadPatientPhoto } from "../../services/patientService.js";
import { deleteMyAccount } from "../../services/authService.js";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    photo_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadProfile = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const data = await getPatientProfile();
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        gender: data.gender || "",
        address: data.address || "",
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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be smaller than 5MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError("");
    try {
      const res = await uploadPatientPhoto(file);
      setProfile((p) => ({ ...p, photo_url: res.photo_url }));
      setSaveSuccess("Profile photo updated successfully.");
    } catch (err) {
      setPhotoError(err.response?.data?.detail || "Failed to upload photo. Use JPG, PNG or WEBP.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const updated = await updatePatientProfile({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim() || null,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        address: profile.address.trim() || null,
      });

      setProfile({
        full_name: updated.full_name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        date_of_birth: updated.date_of_birth || "",
        gender: updated.gender || "",
        address: updated.address || "",
        photo_url: updated.photo_url || profile.photo_url || "",
      });
      setSaveSuccess("Your profile has been saved successfully.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(detail || "We couldn't save your profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteMyAccount();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

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
        Manage your personal information, profile photo, and account details.
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

      <Card className="mt-6">
        {/* Profile Photo Upload */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-clinic-100 border border-slate-200">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-clinic-700">
                {profile.full_name?.charAt(0) || "P"}
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm">
              {isUploadingPhoto ? "Uploading..." : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WEBP up to 5MB</p>
            {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Input
            id="fullName"
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
            id="dob"
            label="Date of birth"
            type="date"
            value={profile.date_of_birth}
            onChange={updateField("date_of_birth")}
          />
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-slate-700">
              Gender
            </label>
            <select
              id="gender"
              value={profile.gender}
              onChange={updateField("gender")}
              className="input-field"
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
              Residential address
            </label>
            <textarea
              id="address"
              rows={3}
              value={profile.address}
              onChange={updateField("address")}
              placeholder="123 Health Ave, Suite 100"
              className="input-field resize-none"
            />
          </div>

          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      {/* Danger Zone: Account Deletion */}
      <Card className="mt-8 border border-red-200 bg-red-50/20">
        <h3 className="text-base font-semibold text-red-800">Danger Zone</h3>
        <p className="text-sm text-slate-500 mt-1">
          Permanently delete your account and all associated appointment records. This action cannot be undone.
        </p>

        {deleteError && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700 border border-red-200">
            {deleteError}
          </div>
        )}

        <div className="mt-4">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Delete My Account
            </button>
          ) : (
            <div className="rounded-lg border border-red-300 bg-white p-4 space-y-3">
              <p className="text-sm font-medium text-red-900">
                Are you sure you want to permanently delete your account?
              </p>
              <p className="text-xs text-slate-500">
                All your profile information and appointments will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, permanently delete"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
