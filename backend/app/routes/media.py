import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Media, User
from ..utils.helpers import save_file, delete_file, allowed_file, get_media_type

media_bp = Blueprint("media", __name__, url_prefix="/api/media")


@media_bp.route("", methods=["GET"])
def list_media():
    section = request.args.get("section")   # messages or gallery
    media_type = request.args.get("type")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    query = Media.query.filter_by(is_published=True)
    if section:
        query = query.filter_by(section=section)
    if media_type:
        query = query.filter_by(media_type=media_type)

    pagination = query.order_by(Media.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "items": [m.to_dict() for m in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@media_bp.route("/<int:media_id>", methods=["GET"])
def get_media(media_id):
    media = Media.query.get_or_404(media_id)
    media.view_count = (media.view_count or 0) + 1
    db.session.commit()
    return jsonify(media.to_dict())


@media_bp.route("/<int:media_id>/download", methods=["GET"])
def download_media(media_id):
    media = Media.query.get_or_404(media_id)
    if not media.allow_download:
        return jsonify({"error": "Download not allowed for this file"}), 403

    media.download_count = (media.download_count or 0) + 1
    db.session.commit()

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    file_path = os.path.join(upload_folder, media.file_url)
    directory = os.path.dirname(file_path)
    filename = os.path.basename(file_path)
    return send_from_directory(directory, filename, as_attachment=True)


@media_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_media():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    section = request.form.get("section", "messages")
    title = request.form.get("title", file.filename)
    description = request.form.get("description", "")
    allow_download = request.form.get("allow_download", "true").lower() == "true"
    tags = request.form.get("tags", "")

    file_path = save_file(file, f"media/{section}")
    media_type = get_media_type(file.filename)

    # Handle thumbnail
    thumbnail = None
    if "thumbnail" in request.files:
        thumb = request.files["thumbnail"]
        thumbnail = save_file(thumb, "media/thumbnails")

    media = Media(
        title=title,
        description=description,
        media_type=media_type,
        file_url=file_path,
        thumbnail=thumbnail,
        section=section,
        allow_download=allow_download,
        tags=tags,
        uploaded_by=user_id,
    )
    db.session.add(media)
    db.session.commit()
    return jsonify({"message": "Media uploaded", "media": media.to_dict()}), 201


@media_bp.route("/<int:media_id>", methods=["PUT"])
@jwt_required()
def update_media(media_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    media = Media.query.get_or_404(media_id)
    data = request.get_json()
    fields = ["title", "description", "section", "is_published", "allow_download", "tags"]
    for f in fields:
        if f in data:
            setattr(media, f, data[f])
    db.session.commit()
    return jsonify({"message": "Media updated", "media": media.to_dict()})


@media_bp.route("/<int:media_id>", methods=["DELETE"])
@jwt_required()
def delete_media(media_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    media = Media.query.get_or_404(media_id)
    delete_file(media.file_url)
    if media.thumbnail:
        delete_file(media.thumbnail)
    db.session.delete(media)
    db.session.commit()
    return jsonify({"message": "Media deleted"})


@media_bp.route("/serve/<path:filename>", methods=["GET"])
def serve_file(filename):
    """Serve uploaded files."""
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    file_dir = os.path.join(upload_folder, os.path.dirname(filename))
    file_name = os.path.basename(filename)
    return send_from_directory(file_dir, file_name)
