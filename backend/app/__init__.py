import os
from flask import Flask, send_from_directory, jsonify
from .config import config
from .extensions import db, jwt, cors, migrate, mail


def create_app(config_name: str = "default") -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config[config_name])

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    migrate.init_app(app, db)
    mail.init_app(app)

    # Register blueprints
    from .routes import (
        auth_bp, courses_bp, media_bp, contact_bp,
        donations_bp, projects_bp, admin_bp, site_bp, sons_bp, events_bp,
    )
    app.register_blueprint(auth_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(donations_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(site_bp)
    app.register_blueprint(sons_bp)
    app.register_blueprint(events_bp)

    # Serve uploaded files
    @app.route("/uploads/<path:filename>")
    def serve_uploads(filename):
        upload_folder = app.config["UPLOAD_FOLDER"]
        directory = os.path.join(upload_folder, os.path.dirname(filename))
        fname = os.path.basename(filename)
        return send_from_directory(directory, fname)

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "Ministry API running"})

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token(error):
        return jsonify({"error": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token(error):
        return jsonify({"error": "Authorization token required"}), 401

    return app
