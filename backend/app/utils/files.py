import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from app.config import settings


def get_upload_dir() -> Path:
    """Get the upload directory path."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return Path(filename).suffix.lower()


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving extension."""
    ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"


async def save_upload_file(file: UploadFile, subfolder: str = "") -> tuple[str, str, int]:
    """
    Save an uploaded file to disk.
    Returns: (file_url, file_type, file_size)
    """
    upload_dir = get_upload_dir()
    
    if subfolder:
        upload_dir = upload_dir / subfolder
        upload_dir.mkdir(parents=True, exist_ok=True)
    
    unique_filename = generate_unique_filename(file.filename or "file")
    file_path = upload_dir / unique_filename
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Check file size
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise ValueError(f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB")
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(content)
    
    # Generate URL (relative to uploads directory)
    file_url = f"/uploads/{subfolder}/{unique_filename}" if subfolder else f"/uploads/{unique_filename}"
    file_type = file.content_type or "application/octet-stream"
    
    return file_url, file_type, file_size


async def delete_file(file_url: str) -> bool:
    """Delete a file by its URL."""
    if not file_url.startswith("/uploads/"):
        return False
    
    relative_path = file_url[9:]  # Remove "/uploads/" prefix
    file_path = get_upload_dir() / relative_path
    
    try:
        if file_path.exists():
            os.remove(file_path)
            return True
    except Exception:
        pass
    
    return False
