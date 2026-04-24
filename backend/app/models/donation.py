from datetime import datetime, timezone
from ..extensions import db


class Donation(db.Model):
    __tablename__ = "donations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    donor_name = db.Column(db.String(120))
    donor_email = db.Column(db.String(120))
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default="USD")
    # status: pending, completed, failed, refunded
    status = db.Column(db.String(20), default="pending")
    payment_method = db.Column(db.String(50))
    payment_ref = db.Column(db.String(200), unique=True)
    message = db.Column(db.Text)
    is_anonymous = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship("User", back_populates="donations")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "donor_name": self.donor_name if not self.is_anonymous else "Anonymous",
            "donor_email": self.donor_email,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "payment_method": self.payment_method,
            "payment_ref": self.payment_ref,
            "message": self.message,
            "is_anonymous": self.is_anonymous,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
