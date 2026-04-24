from datetime import datetime, timezone
from ..extensions import db


class LiveSession(db.Model):
    """Scheduled live sessions — prayer meetings, training, conference calls."""
    __tablename__ = "live_sessions"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    # Types: prayer | training | conference | general | worship
    session_type = db.Column(db.String(30), default="general")
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    # Jitsi room name — auto or custom (e.g. "sons-daughters-prayer-april")
    jitsi_room = db.Column(db.String(200))
    # Admin flips this True when session goes live
    is_active = db.Column(db.Boolean, default=False)
    is_published = db.Column(db.Boolean, default=True)
    # Agenda / notes visible to members
    agenda = db.Column(db.Text)
    # Recording uploaded by admin after session
    recording_url = db.Column(db.String(500))
    recording_notes = db.Column(db.Text)

    # Post-session structured summary (filled by admin after each session)
    summary_prayers = db.Column(db.Text)          # prayer points / requests covered
    summary_teaching = db.Column(db.Text)         # key teaching / training content
    summary_scriptures = db.Column(db.Text)       # key scriptures referenced
    summary_action_items = db.Column(db.Text)     # assignments / action items for disciples
    summary_published = db.Column(db.Boolean, default=False)  # admin flips True to release to members

    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "session_type": self.session_type,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "duration_minutes": self.duration_minutes,
            "jitsi_room": self.jitsi_room,
            "is_active": self.is_active,
            "is_published": self.is_published,
            "agenda": self.agenda,
            "recording_url": self.recording_url,
            "recording_notes": self.recording_notes,
            "summary_prayers": self.summary_prayers,
            "summary_teaching": self.summary_teaching,
            "summary_scriptures": self.summary_scriptures,
            "summary_action_items": self.summary_action_items,
            "summary_published": self.summary_published,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PrayerRequest(db.Model):
    """Private prayer wall — Sons & Daughters members only."""
    __tablename__ = "prayer_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_answered = db.Column(db.Boolean, default=False)
    answered_testimony = db.Column(db.Text)   # what God did
    prayer_count = db.Column(db.Integer, default=0)  # others clicked "I'm praying"
    is_private = db.Column(db.Boolean, default=False) # only user + admin if True
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="prayer_requests")

    def to_dict(self, include_author=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "body": self.body,
            "is_answered": self.is_answered,
            "answered_testimony": self.answered_testimony,
            "prayer_count": self.prayer_count,
            "is_private": self.is_private,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_author and self.user:
            data["author"] = {
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "profile_pic": self.user.profile_pic,
            }
        return data


class SonsAnnouncement(db.Model):
    """Private announcements from admin to Sons & Daughters members."""
    __tablename__ = "sons_announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "is_pinned": self.is_pinned,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
