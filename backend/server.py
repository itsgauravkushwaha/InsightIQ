"""Supervisor entrypoint shim.

The platform's supervisor is configured to run `uvicorn server:app`.
We keep the real application in `main.py` and simply re-export it here.
"""
from main import app  # noqa: F401
