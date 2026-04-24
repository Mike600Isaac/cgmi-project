from datetime import datetime, timezone
from ..extensions import db


class Event(db.Model):
    """Public ministry events — conferences, outreaches, prayer nights, crusades."""
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    banner_image = db.Column(db.String(500))

    # Types: conference | prayer | outreach | training | worship | crusade | general
    event_type = db.Column(db.String(30), default="general")

    # Status managed by admin: upcoming | ongoing | concluded
    status = db.Column(db.String(20), default="upcoming", nullable=False)

    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime)
    location = db.Column(db.String(300))  # physical venue / city
    is_physical = db.Column(db.Boolean, default=False)  # has a physical venue too
    is_published = db.Column(db.Boolean, default=True)

    # ── Live streaming platforms ────────────────────────────────
    # Admin flips this True to show LIVE badges and enable join buttons
    is_live_now = db.Column(db.Boolean, default=False)

    # YouTube: paste full watch URL or live URL  e.g. https://youtu.be/XYZ
    youtube_url = db.Column(db.String(500))
    # Jitsi: room name only, e.g. "ministry-conference-2026"
    jitsi_room = db.Column(db.String(200))
    # Facebook: full Facebook Live video URL
    facebook_url = db.Column(db.String(500))
    # Twitter/X: full Twitter Spaces or live URL
    twitter_url = db.Column(db.String(500))

    # Recording / replay after event concludes
    recording_url = db.Column(db.String(500))
    recording_notes = db.Column(db.Text)

    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "banner_image": self.banner_image,
            "event_type": self.event_type,
            "status": self.status,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "location": self.location,
            "is_physical": self.is_physical,
            "is_published": self.is_published,
            "is_live_now": self.is_live_now,
            "youtube_url": self.youtube_url,
            "jitsi_room": self.jitsi_room,
            "facebook_url": self.facebook_url,
            "twitter_url": self.twitter_url,
            "recording_url": self.recording_url,
            "recording_notes": self.recording_notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PublicPrayer(db.Model):
    """Anyone (including non-members) can drop a prayer request on the homepage."""
    __tablename__ = "public_prayers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))        # optional — can be anonymous
    email = db.Column(db.String(120))       # optional
    prayer_request = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    is_private = db.Column(db.Boolean, default=False)  # if True show as "Anonymous"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self, admin=False):
        data = {
            "id": self.id,
            "name": self.name if not self.is_private else "Anonymous",
            "prayer_request": self.prayer_request,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if admin:
            data["email"] = self.email
            data["is_private"] = self.is_private
        return data
