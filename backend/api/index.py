# Vercel entrypoint: exposes the FastAPI app as a serverless function.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app  # noqa: E402,F401
