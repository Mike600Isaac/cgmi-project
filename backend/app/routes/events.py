"""Events routes — public listing and admin management."""
import os
from datetime import datetime, timezone
from functools import wraps
from flask import Blueprint, jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from werkzeug.utils import secure_filename
from ..extensions import db
from ..models import User
from ..models.event import Event, PublicPrayer

events_bp = Blueprint("events", __name__, url_prefix="/api/events")


# ── helpers ────────────────────────────────────────────────────────────────

def get_uid():
    return int(get_jwt_identity())


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = User.query.get(get_uid())
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


ALLOWED_IMG = {"jpg", "jpeg", "png", "gif", "webp"}


def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMG


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@events_bp.route("", methods=["GET"])
def list_events():
    """Public event listing. Optional ?status=upcoming|ongoing|concluded"""
    status_filter = request.args.get("status")
    q = Event.query.filter_by(is_published=True)
    if status_filter:
        q = q.filter_by(status=status_filter)
    events = q.order_by(
        Event.status.asc(),          # ongoing first, then upcoming, then concluded
        Event.start_date.asc()
    ).all()
    return jsonify([e.to_dict() for e in events]), 200


@events_bp.route("/<int:eid>", methods=["GET"])
def get_event(eid):
    e = Event.query.filter_by(id=eid, is_published=True).first_or_404()
    return jsonify(e.to_dict()), 200


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC PRAYER REQUESTS
# ══════════════════════════════════════════════════════════════════════════════

@events_bp.route("/prayers", methods=["POST"])
def submit_public_prayer():
    data = request.get_json() or {}
    prayer_request = (data.get("prayer_request") or "").strip()
    if not prayer_request:
        return jsonify({"error": "Prayer request is required"}), 400
    if len(prayer_request) > 2000:
        return jsonify({"error": "Prayer request is too long (max 2000 characters)"}), 400

    pr = PublicPrayer(
        name=(data.get("name") or "").strip() or None,
        email=(data.get("email") or "").strip() or None,
        prayer_request=prayer_request,
        is_private=bool(data.get("is_private", False)),
    )
    db.session.add(pr)
    db.session.commit()
    return jsonify({"message": "Your prayer request has been received. We are standing with you!"}), 201


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@events_bp.route("/admin", methods=["GET"])
@admin_required
def admin_list_events():
    """Admin sees all events including unpublished."""
    events = Event.query.order_by(Event.start_date.desc()).all()
    return jsonify([e.to_dict() for e in events]), 200


@events_bp.route("/admin", methods=["POST"])
@admin_required
def create_event():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    start_raw = data.get("start_date")
    try:
        start_date = datetime.fromisoformat(start_raw)
    except Exception:
        return jsonify({"error": "Invalid start_date"}), 400

    end_date = None
    if data.get("end_date"):
        try:
            end_date = datetime.fromisoformat(data["end_date"])
        except Exception:
            return jsonify({"error": "Invalid end_date"}), 400

    event = Event(
        title=title,
        description=data.get("description", ""),
        event_type=data.get("event_type", "general"),
        status=data.get("status", "upcoming"),
        start_date=start_date,
        end_date=end_date,
        location=data.get("location", ""),
        is_physical=bool(data.get("is_physical", False)),
        is_published=bool(data.get("is_published", True)),
        youtube_url=data.get("youtube_url", ""),
        jitsi_room=data.get("jitsi_room", ""),
        facebook_url=data.get("facebook_url", ""),
        twitter_url=data.get("twitter_url", ""),
        created_by=get_uid(),
    )
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201


@events_bp.route("/admin/<int:eid>", methods=["PATCH"])
@admin_required
def update_event(eid):
    e = Event.query.get_or_404(eid)
    data = request.get_json() or {}

    for field in ("title", "description", "event_type", "status", "location",
                  "youtube_url", "jitsi_room", "facebook_url", "twitter_url",
                  "recording_url", "recording_notes"):
        if field in data:
            setattr(e, field, data[field])

    for bool_field in ("is_physical", "is_published", "is_live_now"):
        if bool_field in data:
            setattr(e, bool_field, bool(data[bool_field]))

    if "start_date" in data:
        try:
            e.start_date = datetime.fromisoformat(data["start_date"])
        except Exception:
            return jsonify({"error": "Invalid start_date"}), 400

    if "end_date" in data:
        try:
            e.end_date = datetime.fromisoformat(data["end_date"]) if data["end_date"] else None
        except Exception:
            return jsonify({"error": "Invalid end_date"}), 400

    db.session.commit()
    return jsonify(e.to_dict()), 200


@events_bp.route("/admin/<int:eid>", methods=["DELETE"])
@admin_required
def delete_event(eid):
    e = Event.query.get_or_404(eid)
    db.session.delete(e)
    db.session.commit()
    return jsonify({"message": "Event deleted"}), 200


@events_bp.route("/admin/<int:eid>/go-live", methods=["POST"])
@admin_required
def go_live(eid):
    e = Event.query.get_or_404(eid)
    e.is_live_now = True
    e.status = "ongoing"
    db.session.commit()
    return jsonify({"message": "Event is now LIVE!", "event": e.to_dict()}), 200


@events_bp.route("/admin/<int:eid>/end-live", methods=["POST"])
@admin_required
def end_live(eid):
    e = Event.query.get_or_404(eid)
    e.is_live_now = False
    db.session.commit()
    return jsonify({"message": "Live ended", "event": e.to_dict()}), 200


@events_bp.route("/admin/<int:eid>/conclude", methods=["POST"])
@admin_required
def conclude_event(eid):
    e = Event.query.get_or_404(eid)
    e.status = "concluded"
    e.is_live_now = False
    db.session.commit()
    return jsonify({"message": "Event marked as concluded", "event": e.to_dict()}), 200


# ── Banner image upload ────────────────────────────────────────────────────

@events_bp.route("/admin/<int:eid>/banner", methods=["POST"])
@admin_required
def upload_banner(eid):
    from flask import current_app
    e = Event.query.get_or_404(eid)
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not file or not _allowed(file.filename):
        return jsonify({"error": "Invalid image type"}), 400

    fname = secure_filename(f"event_{eid}_banner_{file.filename}")
    upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "events")
    os.makedirs(upload_path, exist_ok=True)
    file.save(os.path.join(upload_path, fname))
    e.banner_image = f"events/{fname}"
    db.session.commit()
    return jsonify({"banner_image": e.banner_image}), 200


# ── Admin: view public prayer requests ────────────────────────────────────

@events_bp.route("/admin/prayers", methods=["GET"])
@admin_required
def admin_list_prayers():
    prayers = PublicPrayer.query.order_by(PublicPrayer.created_at.desc()).all()
    return jsonify([p.to_dict(admin=True) for p in prayers]), 200


@events_bp.route("/admin/prayers/<int:pid>/read", methods=["PATCH"])
@admin_required
def mark_prayer_read(pid):
    pr = PublicPrayer.query.get_or_404(pid)
    pr.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@events_bp.route("/admin/prayers/<int:pid>", methods=["DELETE"])
@admin_required
def delete_public_prayer(pid):
    pr = PublicPrayer.query.get_or_404(pid)
    db.session.delete(pr)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
