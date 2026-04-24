from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30))
    profile_pic = db.Column(db.String(255))
    # Roles: admin, user
    role = db.Column(db.String(20), nullable=False, default="user")
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False)
    bio = db.Column(db.Text)
    country = db.Column(db.String(100))

    # Sons & Daughters discipleship status
    # None = never applied | applied = pending | approved = active disciple | suspended
    disciple_status = db.Column(db.String(20), nullable=True, default=None)
    disciple_applied_at = db.Column(db.DateTime, nullable=True)
    disciple_approved_at = db.Column(db.DateTime, nullable=True)
    disciple_testimony = db.Column(db.Text, nullable=True)   # application testimony
    disciple_reason = db.Column(db.Text, nullable=True)      # why they want to join
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login = db.Column(db.DateTime)

    # Relationships
    enrollments = db.relationship("Enrollment", back_populates="user", lazy="dynamic")
    donations = db.relationship("Donation", back_populates="user", lazy="dynamic")
    lesson_progress = db.relationship("LessonProgress", back_populates="user", lazy="dynamic")
    certificates = db.relationship("Certificate", back_populates="user", lazy="dynamic")
    prayer_requests = db.relationship("PrayerRequest", back_populates="user", lazy="dynamic")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_private=False):
        data = {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "username": self.username,
            "profile_pic": self.profile_pic,
            "bio": self.bio,
            "country": self.country,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data.update({
                "email": self.email,
                "phone": self.phone,
                "is_active": self.is_active,
                "is_email_verified": self.is_email_verified,
                "last_login": self.last_login.isoformat() if self.last_login else None,
                "disciple_status": self.disciple_status,
                "disciple_applied_at": self.disciple_applied_at.isoformat() if self.disciple_applied_at else None,
                "disciple_approved_at": self.disciple_approved_at.isoformat() if self.disciple_approved_at else None,
            })
        return data

    def __repr__(self):
        return f"<User {self.username}>"
