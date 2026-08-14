from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models import Donation, User
from ..utils.paystack import verify_transaction, PaystackError

donations_bp = Blueprint("donations", __name__, url_prefix="/api/donations")


@donations_bp.route("", methods=["POST"])
def create_donation():
    # Allow both authenticated and anonymous donations
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        user_id = int(identity) if identity else None
    except Exception:
        user_id = None

    data = request.get_json() or {}
    payment_ref = data.get("payment_ref")

    # A payment reference is mandatory — every donation must be a real,
    # verifiable Paystack transaction. No reference => no trust.
    if not payment_ref:
        return jsonify({"error": "Missing payment reference"}), 400

    # Idempotency: never record the same transaction twice.
    if Donation.query.filter_by(payment_ref=payment_ref).first():
        return jsonify({"error": "Donation already recorded"}), 409

    # Verify the payment with Paystack using the secret key. We trust the
    # gateway's amount/currency, NOT whatever the browser claims it paid.
    try:
        verified = verify_transaction(payment_ref)
    except PaystackError as exc:
        return jsonify({"error": f"Payment verification failed: {exc}"}), 402

    user = User.query.get(user_id) if user_id else None

    donation = Donation(
        user_id=user_id,
        donor_name=data.get("donor_name") or (
            f"{user.first_name} {user.last_name}" if user else "Anonymous"
        ),
        donor_email=verified["email"] or data.get("donor_email") or (
            user.email if user else None
        ),
        amount=verified["amount"],          # authoritative amount from Paystack
        currency=verified["currency"],      # authoritative currency from Paystack
        payment_method=data.get("payment_method", "paystack"),
        payment_ref=verified["reference"] or payment_ref,
        message=data.get("message", ""),
        is_anonymous=data.get("is_anonymous", False),
        status="completed",
    )
    db.session.add(donation)
    db.session.commit()
    return jsonify({
        "message": "Thank you for your donation! God bless you.",
        "donation": donation.to_dict(),
    }), 201


@donations_bp.route("", methods=["GET"])
@jwt_required()
def list_donations():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    pagination = Donation.query.order_by(Donation.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    total_amount = db.session.query(
        db.func.sum(Donation.amount)
    ).filter_by(status="completed").scalar() or 0

    return jsonify({
        "items": [d.to_dict() for d in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "total_raised": round(total_amount, 2),
    })


@donations_bp.route("/my", methods=["GET"])
@jwt_required()
def my_donations():
    user_id = int(get_jwt_identity())
    donations = Donation.query.filter_by(user_id=user_id).order_by(
        Donation.created_at.desc()
    ).all()
    return jsonify([d.to_dict() for d in donations])
