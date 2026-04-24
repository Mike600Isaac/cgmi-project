from datetime import datetime, timezone
from ..extensions import db


class SiteContent(db.Model):
    __tablename__ = "site_content"

    id = db.Column(db.Integer, primary_key=True)
    # section: home_hero, home_about, about_ministry, about_evangelist, home_verse, etc.
    section = db.Column(db.String(80), unique=True, nullable=False)
    title = db.Column(db.String(200))
    subtitle = db.Column(db.String(300))
    body = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    extra = db.Column(db.Text)   # JSON blob for flexible extra data
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "section": self.section,
            "title": self.title,
            "subtitle": self.subtitle,
            "body": self.body,
            "image_url": self.image_url,
            "extra": self.extra,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
