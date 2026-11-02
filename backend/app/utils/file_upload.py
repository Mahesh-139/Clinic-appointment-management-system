import os
import uuid
from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_PHOTO_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_PRESCRIPTION_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_PRESCRIPTION_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}
MAX_PRESCRIPTION_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_profile_photo(file: UploadFile, prefix: str = "user") -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_PHOTO_EXTENSIONS or file.content_type not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPG, PNG, WEBP.",
        )

    content = await file.read()
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 5MB.",
        )

    filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
    dest_dir = os.path.join(UPLOAD_DIR, "profiles")
    os.makedirs(dest_dir, exist_ok=True)
    file_path = os.path.join(dest_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return f"/uploads/profiles/{filename}"


async def save_prescription_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if (
        ext not in ALLOWED_PRESCRIPTION_EXTENSIONS
        or file.content_type not in ALLOWED_PRESCRIPTION_MIME_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Allowed formats: PDF, JPG, PNG, WEBP.",
        )

    content = await file.read()
    if len(content) > MAX_PRESCRIPTION_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB.",
        )

    orig_name = os.path.basename(file.filename or f"prescription{ext}")
    unique_name = f"rx_{uuid.uuid4().hex}{ext}"
    dest_dir = os.path.join(UPLOAD_DIR, "prescriptions")
    os.makedirs(dest_dir, exist_ok=True)
    file_path = os.path.join(dest_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return f"/uploads/prescriptions/{unique_name}", orig_name
