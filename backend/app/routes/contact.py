from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Contact, User

contact_bp = Blueprint("contact", __name__, url_prefix="/api/contact")


@contact_bp.route("", methods=["POST"])
def submit_contact():
    data = request.get_json()
    required = ["name", "email", "message"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    contact = Contact(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
        phone=data.get("phone", ""),
        subject=data.get("subject", ""),
        message=data["message"].strip(),
        recipient=data.get("recipient", "ministry"),
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({"message": "Message sent successfully. We'll be in touch soon!"}), 201


@contact_bp.route("", methods=["GET"])
@jwt_required()
def list_contacts():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    recipient = request.args.get("recipient")

    query = Contact.query
    if recipient:
        query = query.filter_by(recipient=recipient)

    pagination = query.order_by(Contact.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "items": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "unread": Contact.query.filter_by(is_read=False).count(),
    })


@contact_bp.route("/<int:contact_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(contact_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    contact = Contact.query.get_or_404(contact_id)
    contact.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"})


@contact_bp.route("/<int:contact_id>", methods=["DELETE"])
@jwt_required()
def delete_contact(contact_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    contact = Contact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Message deleted"})
