import os
import uuid
import random
import string
from datetime import datetime, timezone
from flask import current_app
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {
    "video": {"mp4", "webm", "ogg", "mov", "avi"},
    "audio": {"mp3", "wav", "ogg", "aac", "m4a"},
    "image": {"jpg", "jpeg", "png", "gif", "webp"},
    "document": {"pdf", "doc", "docx", "txt", "ppt", "pptx"},
}


def allowed_file(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    all_exts = set()
    for exts in ALLOWED_EXTENSIONS.values():
        all_exts |= exts
    return ext in all_exts


def get_media_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    for media_type, exts in ALLOWED_EXTENSIONS.items():
        if ext in exts:
            return media_type
    return "document"


def save_file(file, subfolder: str = "") -> str:
    """Save an uploaded file and return the relative path."""
    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, unique_name)
    file.save(filepath)
    relative = os.path.join(subfolder, unique_name).replace("\\", "/")
    return relative


def delete_file(relative_path: str):
    """Delete a file from the uploads folder."""
    if not relative_path:
        return
    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)


def generate_certificate_number() -> str:
    year = datetime.now(timezone.utc).strftime("%Y")
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"CERT-{year}-{suffix}"


def paginate_query(query, page: int, per_page: int = 20):
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": pagination.items,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": pagination.per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }
