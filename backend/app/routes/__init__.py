from .auth import auth_bp
from .courses import courses_bp
from .media import media_bp
from .contact import contact_bp
from .donations import donations_bp
from .projects import projects_bp
from .admin import admin_bp
from .site import site_bp
from .sons import sons_bp
from .events import events_bp

__all__ = [
    "auth_bp", "courses_bp", "media_bp", "contact_bp",
    "donations_bp", "projects_bp", "admin_bp", "site_bp",
    "sons_bp", "events_bp",
]
