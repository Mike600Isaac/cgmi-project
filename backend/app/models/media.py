from datetime import datetime, timezone
from ..extensions import db


class Media(db.Model):
    __tablename__ = "media"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    # media_type: video, audio, photo, pdf, word, document
    media_type = db.Column(db.String(30), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    thumbnail = db.Column(db.String(255))
    file_size = db.Column(db.BigInteger)   # bytes
    duration = db.Column(db.Integer)       # seconds for video/audio
    # section: messages, gallery
    section = db.Column(db.String(30), nullable=False, default="messages")
    is_published = db.Column(db.Boolean, default=True)
    allow_download = db.Column(db.Boolean, default=True)
    tags = db.Column(db.String(500))        # comma-separated
    view_count = db.Column(db.Integer, default=0)
    download_count = db.Column(db.Integer, default=0)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "media_type": self.media_type,
            "file_url": self.file_url,
            "thumbnail": self.thumbnail,
            "file_size": self.file_size,
            "duration": self.duration,
            "section": self.section,
            "is_published": self.is_published,
            "allow_download": self.allow_download,
            "tags": self.tags.split(",") if self.tags else [],
            "view_count": self.view_count,
            "download_count": self.download_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Media {self.title}>"
