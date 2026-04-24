from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Course, Enrollment, Media, Donation, Contact, Certificate

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _require_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return None, jsonify({"error": "Admin access required"}), 403
    return user, None, None


@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    total_users = User.query.count()
    total_courses = Course.query.count()
    total_enrollments = Enrollment.query.count()
    total_media = Media.query.count()
    total_donations = db.session.query(
        db.func.sum(Donation.amount)
    ).filter_by(status="completed").scalar() or 0
    unread_messages = Contact.query.filter_by(is_read=False).count()
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    recent_enrollments = Enrollment.query.order_by(
        Enrollment.enrolled_at.desc()
    ).limit(5).all()

    return jsonify({
        "stats": {
            "total_users": total_users,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "total_media": total_media,
            "total_donations_raised": round(float(total_donations), 2),
            "unread_messages": unread_messages,
        },
        "recent_users": [u.to_dict(include_private=True) for u in recent_users],
        "recent_enrollments": [e.to_dict() for e in recent_enrollments],
    })


# ── User management ──────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "")

    query = User.query
    if search:
        query = query.filter(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "items": [u.to_dict(include_private=True) for u in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@admin_bp.route("/users/<int:uid>", methods=["GET"])
@jwt_required()
def get_user(uid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    target = User.query.get_or_404(uid)
    return jsonify(target.to_dict(include_private=True))


@admin_bp.route("/users/<int:uid>", methods=["PUT"])
@jwt_required()
def update_user(uid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    target = User.query.get_or_404(uid)
    data = request.get_json()
    fields = ["first_name", "last_name", "phone", "role", "is_active", "country"]
    for f in fields:
        if f in data:
            setattr(target, f, data[f])
    db.session.commit()
    return jsonify({"message": "User updated", "user": target.to_dict(include_private=True)})


@admin_bp.route("/users/<int:uid>/toggle-active", methods=["PATCH"])
@jwt_required()
def toggle_user_active(uid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    target = User.query.get_or_404(uid)
    target.is_active = not target.is_active
    db.session.commit()
    status = "activated" if target.is_active else "deactivated"
    return jsonify({"message": f"User {status}", "is_active": target.is_active})


@admin_bp.route("/users/<int:uid>/reset-password", methods=["POST"])
@jwt_required()
def reset_user_password(uid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    target = User.query.get_or_404(uid)
    data = request.get_json()
    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    target.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password reset successfully"})


# ── Enrollment management ─────────────────────────────────────────────────────

@admin_bp.route("/enrollments", methods=["GET"])
@jwt_required()
def list_enrollments():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    course_id = request.args.get("course_id")

    query = Enrollment.query
    if course_id:
        query = query.filter_by(course_id=int(course_id))

    pagination = query.order_by(Enrollment.enrolled_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "items": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@admin_bp.route("/enrollments/<int:eid>/approve", methods=["PATCH"])
@jwt_required()
def approve_enrollment(eid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    enrollment = Enrollment.query.get_or_404(eid)
    enrollment.is_approved = True
    db.session.commit()
    return jsonify({"message": "Enrollment approved"})


@admin_bp.route("/certificates", methods=["GET"])
@jwt_required()
def list_certificates():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    certs = Certificate.query.order_by(Certificate.issued_at.desc()).all()
    return jsonify([c.to_dict() for c in certs])
