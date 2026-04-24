from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import SiteContent, User

site_bp = Blueprint("site", __name__, url_prefix="/api/site")


@site_bp.route("/content", methods=["GET"])
def get_all_content():
    contents = SiteContent.query.all()
    return jsonify({c.section: c.to_dict() for c in contents})


@site_bp.route("/content/<section>", methods=["GET"])
def get_section(section):
    content = SiteContent.query.filter_by(section=section).first()
    if not content:
        return jsonify({"error": "Section not found"}), 404
    return jsonify(content.to_dict())


@site_bp.route("/content/<section>", methods=["PUT"])
@jwt_required()
def update_section(section):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    content = SiteContent.query.filter_by(section=section).first()
    if not content:
        content = SiteContent(section=section)
        db.session.add(content)

    data = request.get_json()
    fields = ["title", "subtitle", "body", "image_url", "extra"]
    for f in fields:
        if f in data:
            setattr(content, f, data[f])

    db.session.commit()
    return jsonify({"message": "Content updated", "content": content.to_dict()})


@site_bp.route("/content/<section>/image", methods=["POST"])
@jwt_required()
def upload_section_image(section):
    from ..utils.helpers import save_file, delete_file, allowed_file
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    content = SiteContent.query.filter_by(section=section).first()
    if not content:
        content = SiteContent(section=section)
        db.session.add(content)

    if content.image_url:
        delete_file(content.image_url)

    path = save_file(file, "site")
    content.image_url = path
    db.session.commit()
    return jsonify({"image_url": path})
