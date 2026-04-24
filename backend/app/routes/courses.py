from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models import Course, Lesson, Enrollment, LessonProgress, Certificate, User
from ..utils.helpers import save_file, delete_file, allowed_file, generate_certificate_number

courses_bp = Blueprint("courses", __name__, url_prefix="/api/courses")


def _get_user_optional():
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


# ── Public: list & detail ────────────────────────────────────────────────────

@courses_bp.route("", methods=["GET"])
def list_courses():
    category = request.args.get("category")
    query = Course.query.filter_by(is_published=True)
    if category:
        query = query.filter_by(category=category)
    courses = query.order_by(Course.order).all()
    return jsonify([c.to_dict() for c in courses])


@courses_bp.route("/<int:course_id>", methods=["GET"])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    user_id = _get_user_optional()
    data = course.to_dict(include_lessons=True)

    enrolled = False
    progress = 0
    if user_id:
        enrollment = Enrollment.query.filter_by(
            user_id=user_id, course_id=course_id
        ).first()
        if enrollment:
            enrolled = True
            progress = enrollment.progress

    # Hide content_url for non-enrolled users on paid courses
    if not enrolled and not course.is_free:
        for lesson in data.get("lessons", []):
            if not lesson.get("is_preview"):
                lesson["content_url"] = None

    data["enrolled"] = enrolled
    data["progress"] = progress
    return jsonify(data)


# ── Enrollment ───────────────────────────────────────────────────────────────

@courses_bp.route("/<int:course_id>/enroll", methods=["POST"])
@jwt_required()
def enroll(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.get_or_404(course_id)

    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return jsonify({"error": "Already enrolled"}), 409

    payment_status = "free" if course.is_free else "pending"
    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id,
        payment_status=payment_status,
        is_approved=not course.requires_approval,
    )
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({"message": "Enrolled successfully", "enrollment": enrollment.to_dict()}), 201


# ── Lesson access ─────────────────────────────────────────────────────────────

@courses_bp.route("/<int:course_id>/lessons/<int:lesson_id>", methods=["GET"])
@jwt_required()
def get_lesson(course_id, lesson_id):
    user_id = int(get_jwt_identity())
    lesson = Lesson.query.filter_by(id=lesson_id, course_id=course_id).first_or_404()
    course = lesson.course

    if not course.is_free:
        enrollment = Enrollment.query.filter_by(
            user_id=user_id, course_id=course_id, is_approved=True
        ).first()
        if not enrollment or enrollment.payment_status == "pending":
            if not lesson.is_preview:
                return jsonify({"error": "Enroll in this course to access lessons"}), 403

    data = lesson.to_dict()
    # Track view
    progress = LessonProgress.query.filter_by(
        user_id=user_id, lesson_id=lesson_id
    ).first()
    data["completed"] = progress.completed if progress else False
    return jsonify(data)


@courses_bp.route("/<int:course_id>/lessons/<int:lesson_id>/complete", methods=["POST"])
@jwt_required()
def mark_complete(course_id, lesson_id):
    user_id = int(get_jwt_identity())
    lesson = Lesson.query.filter_by(id=lesson_id, course_id=course_id).first_or_404()

    enrollment = Enrollment.query.filter_by(
        user_id=user_id, course_id=course_id
    ).first()
    if not enrollment:
        return jsonify({"error": "Not enrolled"}), 403

    progress = LessonProgress.query.filter_by(
        user_id=user_id, lesson_id=lesson_id
    ).first()

    if not progress:
        progress = LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.session.add(progress)

    progress.completed = True
    progress.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    # Check if entire course is complete
    course_progress = enrollment.progress
    if course_progress == 100 and not enrollment.completed_at:
        enrollment.completed_at = datetime.now(timezone.utc)
        db.session.commit()
        # Auto-issue certificate
        cert = _issue_certificate(user_id, course_id)
        return jsonify({
            "message": "Lesson completed. Course complete! Certificate issued.",
            "progress": course_progress,
            "certificate": cert.to_dict() if cert else None,
        })

    return jsonify({"message": "Lesson marked complete", "progress": course_progress})


def _issue_certificate(user_id, course_id):
    existing = Certificate.query.filter_by(
        user_id=user_id, course_id=course_id
    ).first()
    if existing:
        return existing

    from ..utils.certificate import generate_certificate
    user = User.query.get(user_id)
    course = Course.query.get(course_id)
    cert_number = generate_certificate_number()

    try:
        cert_path = generate_certificate(user, course, cert_number)
    except Exception:
        cert_path = None

    cert = Certificate(
        user_id=user_id,
        course_id=course_id,
        certificate_number=cert_number,
        certificate_url=cert_path,
    )
    db.session.add(cert)
    db.session.commit()
    return cert


# ── User enrollments ──────────────────────────────────────────────────────────

@courses_bp.route("/my-enrollments", methods=["GET"])
@jwt_required()
def my_enrollments():
    user_id = int(get_jwt_identity())
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    return jsonify([e.to_dict() for e in enrollments])


@courses_bp.route("/my-certificates", methods=["GET"])
@jwt_required()
def my_certificates():
    user_id = int(get_jwt_identity())
    certs = Certificate.query.filter_by(user_id=user_id).all()
    return jsonify([c.to_dict() for c in certs])


# ── Admin: CRUD courses & lessons ─────────────────────────────────────────────

@courses_bp.route("/admin", methods=["POST"])
@jwt_required()
def create_course():
    from ..utils.decorators import admin_required
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    course = Course(
        title=data["title"],
        description=data.get("description", ""),
        category=data.get("category", "other"),
        price=float(data.get("price", 0)),
        is_free=data.get("is_free", True),
        is_published=data.get("is_published", False),
        requires_approval=data.get("requires_approval", False),
        order=data.get("order", 0),
        created_by=user_id,
    )
    db.session.add(course)
    db.session.commit()
    return jsonify({"message": "Course created", "course": course.to_dict()}), 201


@courses_bp.route("/admin/<int:course_id>", methods=["PUT"])
@jwt_required()
def update_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    fields = ["title", "description", "category", "price", "is_free",
              "is_published", "requires_approval", "order"]
    for f in fields:
        if f in data:
            setattr(course, f, data[f])
    db.session.commit()
    return jsonify({"message": "Course updated", "course": course.to_dict()})


@courses_bp.route("/admin/<int:course_id>", methods=["DELETE"])
@jwt_required()
def delete_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"})


@courses_bp.route("/admin/<int:course_id>/thumbnail", methods=["POST"])
@jwt_required()
def upload_thumbnail(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    course = Course.query.get_or_404(course_id)
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    if course.thumbnail:
        delete_file(course.thumbnail)
    path = save_file(file, "courses/thumbnails")
    course.thumbnail = path
    db.session.commit()
    return jsonify({"thumbnail": path})


@courses_bp.route("/admin/<int:course_id>/lessons", methods=["POST"])
@jwt_required()
def add_lesson(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    course = Course.query.get_or_404(course_id)

    if request.content_type and "multipart" in request.content_type:
        # File upload lesson
        title = request.form.get("title")
        content_type = request.form.get("content_type", "document")
        description = request.form.get("description", "")
        order = int(request.form.get("order", 0))
        is_preview = request.form.get("is_preview", "false").lower() == "true"

        if "file" in request.files:
            file = request.files["file"]
            content_url = save_file(file, f"courses/{course_id}")
        else:
            content_url = None

        lesson = Lesson(
            course_id=course_id,
            title=title,
            description=description,
            content_type=content_type,
            content_url=content_url,
            order=order,
            is_preview=is_preview,
        )
    else:
        data = request.get_json()
        lesson = Lesson(
            course_id=course_id,
            title=data["title"],
            description=data.get("description", ""),
            content_type=data.get("content_type", "text"),
            content_url=data.get("content_url"),
            content_text=data.get("content_text"),
            order=data.get("order", 0),
            is_preview=data.get("is_preview", False),
            duration=data.get("duration"),
        )

    db.session.add(lesson)
    db.session.commit()
    return jsonify({"message": "Lesson added", "lesson": lesson.to_dict()}), 201


@courses_bp.route("/admin/lessons/<int:lesson_id>", methods=["PUT"])
@jwt_required()
def update_lesson(lesson_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.get_json()
    fields = ["title", "description", "content_type", "content_url",
              "content_text", "order", "is_preview", "duration"]
    for f in fields:
        if f in data:
            setattr(lesson, f, data[f])
    db.session.commit()
    return jsonify({"message": "Lesson updated", "lesson": lesson.to_dict()})


@courses_bp.route("/admin/lessons/<int:lesson_id>", methods=["DELETE"])
@jwt_required()
def delete_lesson(lesson_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.content_url:
        delete_file(lesson.content_url)
    db.session.delete(lesson)
    db.session.commit()
    return jsonify({"message": "Lesson deleted"})
