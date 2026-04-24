from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models import User


def get_current_user_id():
    """Always returns user id as int regardless of JWT identity type."""
    return int(get_jwt_identity())


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def active_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Account is inactive"}), 403
        return fn(*args, **kwargs)
    return wrapper
