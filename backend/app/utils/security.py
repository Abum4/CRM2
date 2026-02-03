from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[UUID]:
    """Extract user ID from token."""
    payload = decode_token(token)
    if payload:
        user_id = payload.get("sub")
        if user_id:
            return UUID(user_id)
    return None


# Admin code management
_admin_code: Optional[str] = None
_admin_code_expires: Optional[datetime] = None


def generate_admin_code() -> str:
    """Generate a new admin code that expires in 24 hours."""
    import secrets
    global _admin_code, _admin_code_expires
    _admin_code = secrets.token_hex(4).upper()  # 8 character hex code
    _admin_code_expires = datetime.utcnow() + timedelta(hours=24)
    return _admin_code


def verify_admin_code(code: str) -> bool:
    """Verify the admin code."""
    global _admin_code, _admin_code_expires
    if not _admin_code or not _admin_code_expires:
        return False
    if datetime.utcnow() > _admin_code_expires:
        return False
    return code == _admin_code


def get_current_admin_code() -> Optional[str]:
    """Get the current admin code if valid."""
    global _admin_code, _admin_code_expires
    if not _admin_code or not _admin_code_expires:
        return None
    if datetime.utcnow() > _admin_code_expires:
        return None
    return _admin_code
