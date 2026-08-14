"""Production entrypoint.

Run with a real WSGI server (waitress is bundled in requirements):

    cd backend
    venv/Scripts/python.exe -m waitress --host=0.0.0.0 --port=5000 wsgi:app

Set FLASK_ENV=production and FLASK_DEBUG=0 in the environment first so debug
mode and the auto-reloader stay off.
"""
import os
from app import create_app

app = create_app(os.getenv("FLASK_ENV", "production"))

if __name__ == "__main__":
    from waitress import serve
    port = int(os.getenv("PORT", 5000))
    serve(app, host="0.0.0.0", port=port)
