"""
Password hashing using bcrypt directly — plain-text passwords are never
stored or logged anywhere in this app.
"""

import bcrypt


def hash_password(plain_password: str) -> str:
    """Hash a plain text password using bcrypt with a salt."""
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False

