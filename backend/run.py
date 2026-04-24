import os
from app import create_app
from app.extensions import db

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.cli.command("init-db")
def init_db():
    """Create all database tables and seed initial data."""
    with app.app_context():
        db.create_all()
        _seed_defaults()
        print("Database initialized successfully.")


def _seed_defaults():
    from app.models import SiteContent
    defaults = [
        {"section": "home_hero", "title": "Welcome to the Ministry",
         "subtitle": "Transforming lives through the power of God's Word",
         "body": "Join us as we proclaim the Gospel to the ends of the earth."},
        {"section": "home_about", "title": "About Our Ministry",
         "body": "We are a Spirit-filled ministry dedicated to winning souls, making disciples and raising kingdom builders."},
        {"section": "about_ministry", "title": "About the Ministry",
         "body": "Our ministry was founded on the solid foundation of Jesus Christ..."},
        {"section": "about_evangelist", "title": "About the Evangelist",
         "body": "Called by God with a burning passion for souls..."},
        {"section": "home_verse", "title": "Matthew 28:19-20",
         "body": "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."},
    ]
    for d in defaults:
        if not SiteContent.query.filter_by(section=d["section"]).first():
            db.session.add(SiteContent(**d))
    db.session.commit()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
