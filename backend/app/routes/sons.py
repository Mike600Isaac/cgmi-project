"""Sons & Daughters discipleship platform routes."""
from datetime import datetime, timezone
from functools import wraps
from flask import Blueprint, jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, jwt_required
from ..extensions import db
from ..models import User
from ..models.sons import LiveSession, PrayerRequest, SonsAnnouncement

sons_bp = Blueprint("sons", __name__, url_prefix="/api/sons")


# ── helpers ────────────────────────────────────────────────────────────────

def get_uid():
    return int(get_jwt_identity())


def disciple_required(fn):
    """Decorator: JWT + approved disciple (or admin)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = User.query.get(get_uid())
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.role != "admin" and user.disciple_status != "approved":
            return jsonify({"error": "Sons & Daughters access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = User.query.get(get_uid())
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ══════════════════════════════════════════════════════════════════════════════
# APPLICATION
# ══════════════════════════════════════════════════════════════════════════════

@sons_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply():
    """Submit or update a discipleship application."""
    user = User.query.get(get_uid())
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.disciple_status == "approved":
        return jsonify({"error": "You are already an approved disciple"}), 400
    if user.disciple_status == "suspended":
        return jsonify({"error": "Your discipleship has been suspended. Contact admin."}), 403

    data = request.get_json() or {}
    testimony = (data.get("testimony") or "").strip()
    reason = (data.get("reason") or "").strip()

    if not testimony or not reason:
        return jsonify({"error": "Testimony and reason are required"}), 400

    user.disciple_status = "applied"
    user.disciple_applied_at = datetime.now(timezone.utc)
    user.disciple_testimony = testimony
    user.disciple_reason = reason
    db.session.commit()

    return jsonify({"message": "Application submitted. The admin will review it shortly.", "status": "applied"}), 200


@sons_bp.route("/status", methods=["GET"])
@jwt_required()
def my_status():
    """Return the current user's discipleship status."""
    user = User.query.get(get_uid())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "disciple_status": user.disciple_status,
        "disciple_applied_at": user.disciple_applied_at.isoformat() if user.disciple_applied_at else None,
        "disciple_approved_at": user.disciple_approved_at.isoformat() if user.disciple_approved_at else None,
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# LIVE SESSIONS  (disciples read; admin manage)
# ══════════════════════════════════════════════════════════════════════════════

@sons_bp.route("/sessions", methods=["GET"])
@disciple_required
def list_sessions():
    """List upcoming + past sessions visible to disciples."""
    sessions = (
        LiveSession.query
        .filter_by(is_published=True)
        .order_by(LiveSession.scheduled_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in sessions]), 200


@sons_bp.route("/sessions/<int:sid>", methods=["GET"])
@disciple_required
def get_session(sid):
    s = LiveSession.query.get_or_404(sid)
    if not s.is_published:
        # admins can still see unpublished
        verify_jwt_in_request()
        u = User.query.get(get_uid())
        if not u or u.role != "admin":
            return jsonify({"error": "Not found"}), 404
    return jsonify(s.to_dict()), 200


# ── Admin: create session ──────────────────────────────────────────────────

@sons_bp.route("/admin/sessions", methods=["POST"])
@admin_required
def create_session():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    scheduled_raw = data.get("scheduled_at")
    try:
        scheduled_at = datetime.fromisoformat(scheduled_raw)
    except Exception:
        return jsonify({"error": "Invalid scheduled_at datetime"}), 400

    # Auto-generate a Jitsi room name if not provided
    jitsi_room = (data.get("jitsi_room") or "").strip()
    if not jitsi_room:
        slug = title.lower().replace(" ", "-")[:40]
        jitsi_room = f"sons-daughters-{slug}"

    session = LiveSession(
        title=title,
        description=data.get("description", ""),
        session_type=data.get("session_type", "general"),
        scheduled_at=scheduled_at,
        duration_minutes=int(data.get("duration_minutes", 60)),
        jitsi_room=jitsi_room,
        is_published=bool(data.get("is_published", True)),
        agenda=data.get("agenda", ""),
        created_by=get_uid(),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@sons_bp.route("/admin/sessions/<int:sid>", methods=["PATCH"])
@admin_required
def update_session(sid):
    s = LiveSession.query.get_or_404(sid)
    data = request.get_json() or {}

    for field in ("title", "description", "session_type", "agenda",
                  "jitsi_room", "recording_url", "recording_notes",
                  "summary_prayers", "summary_teaching", "summary_scriptures",
                  "summary_action_items", "summary_published"):
        if field in data:
            setattr(s, field, data[field])

    if "scheduled_at" in data:
        try:
            s.scheduled_at = datetime.fromisoformat(data["scheduled_at"])
        except Exception:
            return jsonify({"error": "Invalid scheduled_at"}), 400

    if "duration_minutes" in data:
        s.duration_minutes = int(data["duration_minutes"])
    if "is_active" in data:
        s.is_active = bool(data["is_active"])
    if "is_published" in data:
        s.is_published = bool(data["is_published"])

    db.session.commit()
    return jsonify(s.to_dict()), 200


@sons_bp.route("/admin/sessions/<int:sid>", methods=["DELETE"])
@admin_required
def delete_session(sid):
    s = LiveSession.query.get_or_404(sid)
    db.session.delete(s)
    db.session.commit()
    return jsonify({"message": "Session deleted"}), 200


@sons_bp.route("/admin/sessions/<int:sid>/summary", methods=["POST"])
@admin_required
def save_summary(sid):
    """Admin saves / updates the post-session structured summary."""
    s = LiveSession.query.get_or_404(sid)
    data = request.get_json() or {}
    for field in ("summary_prayers", "summary_teaching", "summary_scriptures",
                  "summary_action_items", "recording_url", "recording_notes"):
        if field in data:
            setattr(s, field, data[field])
    if "summary_published" in data:
        s.summary_published = bool(data["summary_published"])
    db.session.commit()
    return jsonify({"message": "Summary saved", "session": s.to_dict()}), 200


@sons_bp.route("/admin/sessions/<int:sid>/go-live", methods=["POST"])
@admin_required
def go_live(sid):
    """Flip is_active=True — disciples can now see the Join button."""
    s = LiveSession.query.get_or_404(sid)
    s.is_active = True
    db.session.commit()
    return jsonify({"message": "Session is now live", "session": s.to_dict()}), 200


@sons_bp.route("/admin/sessions/<int:sid>/end-live", methods=["POST"])
@admin_required
def end_live(sid):
    s = LiveSession.query.get_or_404(sid)
    s.is_active = False
    db.session.commit()
    return jsonify({"message": "Session ended", "session": s.to_dict()}), 200


# ── Admin: list ALL sessions (including unpublished) ───────────────────────

@sons_bp.route("/admin/sessions", methods=["GET"])
@admin_required
def admin_list_sessions():
    sessions = LiveSession.query.order_by(LiveSession.scheduled_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


# ══════════════════════════════════════════════════════════════════════════════
# PRAYER WALL
# ══════════════════════════════════════════════════════════════════════════════

@sons_bp.route("/prayer", methods=["GET"])
@disciple_required
def list_prayers():
    uid = get_uid()
    user = User.query.get(uid)
    is_admin = user.role == "admin"

    # Admins see everything; disciples see public + their own private
    if is_admin:
        prayers = PrayerRequest.query.order_by(PrayerRequest.created_at.desc()).all()
    else:
        prayers = (
            PrayerRequest.query
            .filter(
                (PrayerRequest.is_private == False) |
                (PrayerRequest.user_id == uid)
            )
            .order_by(PrayerRequest.created_at.desc())
            .all()
        )

    return jsonify([p.to_dict() for p in prayers]), 200


@sons_bp.route("/prayer", methods=["POST"])
@disciple_required
def create_prayer():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    if not title or not body:
        return jsonify({"error": "Title and body are required"}), 400

    pr = PrayerRequest(
        user_id=get_uid(),
        title=title,
        body=body,
        is_private=bool(data.get("is_private", False)),
    )
    db.session.add(pr)
    db.session.commit()
    return jsonify(pr.to_dict()), 201


@sons_bp.route("/prayer/<int:pid>", methods=["PATCH"])
@disciple_required
def update_prayer(pid):
    pr = PrayerRequest.query.get_or_404(pid)
    uid = get_uid()
    user = User.query.get(uid)

    # Only owner or admin may edit
    if pr.user_id != uid and user.role != "admin":
        return jsonify({"error": "Not authorised"}), 403

    data = request.get_json() or {}
    for field in ("title", "body", "is_private", "is_answered", "answered_testimony"):
        if field in data:
            setattr(pr, field, data[field])

    db.session.commit()
    return jsonify(pr.to_dict()), 200


@sons_bp.route("/prayer/<int:pid>", methods=["DELETE"])
@disciple_required
def delete_prayer(pid):
    pr = PrayerRequest.query.get_or_404(pid)
    uid = get_uid()
    user = User.query.get(uid)
    if pr.user_id != uid and user.role != "admin":
        return jsonify({"error": "Not authorised"}), 403
    db.session.delete(pr)
    db.session.commit()
    return jsonify({"message": "Prayer request deleted"}), 200


@sons_bp.route("/prayer/<int:pid>/pray", methods=["POST"])
@disciple_required
def pray_for(pid):
    """Increment the 'I'm praying' counter."""
    pr = PrayerRequest.query.get_or_404(pid)
    pr.prayer_count = (pr.prayer_count or 0) + 1
    db.session.commit()
    return jsonify({"prayer_count": pr.prayer_count}), 200


# ══════════════════════════════════════════════════════════════════════════════
# ANNOUNCEMENTS
# ══════════════════════════════════════════════════════════════════════════════

@sons_bp.route("/announcements", methods=["GET"])
@disciple_required
def list_announcements():
    announcements = (
        SonsAnnouncement.query
        .order_by(SonsAnnouncement.is_pinned.desc(), SonsAnnouncement.created_at.desc())
        .all()
    )
    return jsonify([a.to_dict() for a in announcements]), 200


@sons_bp.route("/admin/announcements", methods=["POST"])
@admin_required
def create_announcement():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    if not title or not body:
        return jsonify({"error": "Title and body are required"}), 400

    ann = SonsAnnouncement(
        title=title,
        body=body,
        is_pinned=bool(data.get("is_pinned", False)),
        created_by=get_uid(),
    )
    db.session.add(ann)
    db.session.commit()
    return jsonify(ann.to_dict()), 201


@sons_bp.route("/admin/announcements/<int:aid>", methods=["PATCH"])
@admin_required
def update_announcement(aid):
    ann = SonsAnnouncement.query.get_or_404(aid)
    data = request.get_json() or {}
    for field in ("title", "body", "is_pinned"):
        if field in data:
            setattr(ann, field, data[field])
    db.session.commit()
    return jsonify(ann.to_dict()), 200


@sons_bp.route("/admin/announcements/<int:aid>", methods=["DELETE"])
@admin_required
def delete_announcement(aid):
    ann = SonsAnnouncement.query.get_or_404(aid)
    db.session.delete(ann)
    db.session.commit()
    return jsonify({"message": "Announcement deleted"}), 200


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — DISCIPLE MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@sons_bp.route("/admin/applications", methods=["GET"])
@admin_required
def list_applications():
    """All pending applications."""
    applicants = (
        User.query
        .filter(User.disciple_status.in_(["applied", "approved", "suspended"]))
        .order_by(User.disciple_applied_at.desc())
        .all()
    )
    return jsonify([
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "username": u.username,
            "profile_pic": u.profile_pic,
            "disciple_status": u.disciple_status,
            "disciple_applied_at": u.disciple_applied_at.isoformat() if u.disciple_applied_at else None,
            "disciple_approved_at": u.disciple_approved_at.isoformat() if u.disciple_approved_at else None,
            "disciple_testimony": u.disciple_testimony,
            "disciple_reason": u.disciple_reason,
        }
        for u in applicants
    ]), 200


@sons_bp.route("/admin/applications/<int:uid>/approve", methods=["POST"])
@admin_required
def approve_disciple(uid):
    user = User.query.get_or_404(uid)
    user.disciple_status = "approved"
    user.disciple_approved_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": f"{user.first_name} has been approved as a disciple"}), 200


@sons_bp.route("/admin/applications/<int:uid>/reject", methods=["POST"])
@admin_required
def reject_disciple(uid):
    user = User.query.get_or_404(uid)
    user.disciple_status = None          # reset — they may re-apply
    user.disciple_applied_at = None
    user.disciple_testimony = None
    user.disciple_reason = None
    db.session.commit()
    return jsonify({"message": f"Application for {user.first_name} has been rejected"}), 200


@sons_bp.route("/admin/applications/<int:uid>/suspend", methods=["POST"])
@admin_required
def suspend_disciple(uid):
    user = User.query.get_or_404(uid)
    user.disciple_status = "suspended"
    db.session.commit()
    return jsonify({"message": f"{user.first_name} has been suspended"}), 200
