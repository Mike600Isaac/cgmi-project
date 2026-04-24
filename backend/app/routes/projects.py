from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Project, User
from ..utils.helpers import save_file, delete_file, allowed_file

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("", methods=["GET"])
def list_projects():
    projects = Project.query.filter_by(is_published=True).order_by(
        Project.order, Project.created_at.desc()
    ).all()
    return jsonify([p.to_dict() for p in projects])


@projects_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify(project.to_dict())


@projects_bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    project = Project(
        title=data["title"],
        description=data.get("description", ""),
        status=data.get("status", "ongoing"),
        goal_amount=data.get("goal_amount"),
        location=data.get("location", ""),
        order=data.get("order", 0),
        is_published=data.get("is_published", True),
    )
    if data.get("start_date"):
        from datetime import date
        project.start_date = date.fromisoformat(data["start_date"])
    if data.get("end_date"):
        from datetime import date
        project.end_date = date.fromisoformat(data["end_date"])

    db.session.add(project)
    db.session.commit()
    return jsonify({"message": "Project created", "project": project.to_dict()}), 201


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    fields = ["title", "description", "status", "goal_amount", "raised_amount",
              "location", "order", "is_published"]
    for f in fields:
        if f in data:
            setattr(project, f, data[f])
    db.session.commit()
    return jsonify({"message": "Project updated", "project": project.to_dict()})


@projects_bp.route("/<int:project_id>/image", methods=["POST"])
@jwt_required()
def upload_image(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    project = Project.query.get_or_404(project_id)
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    if project.image_url:
        delete_file(project.image_url)
    path = save_file(file, "projects")
    project.image_url = path
    db.session.commit()
    return jsonify({"image_url": path})


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    project = Project.query.get_or_404(project_id)
    if project.image_url:
        delete_file(project.image_url)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"})
