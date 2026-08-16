"""
Small wrapper around calls to the ml/ service (the Flask app in ../ml/app.py).

Keeping this in one place means the views don't need to know about
request formatting, timeouts, etc — and it's the one spot to change if
the ml service's URL or contract ever shifts.
"""

import requests
from django.conf import settings

ML_TIMEOUT_SECONDS = 60


class MLServiceError(Exception):
    pass


def analyse_room(*, room_type, length, width, height, styles, budget, scope, num_rooms, harmony, image_file=None):
    data = {
        "room_type": room_type,
        "length": length,
        "width": width,
        "height": height,
        "styles": styles if isinstance(styles, str) else __import__("json").dumps(styles),
        "budget": budget,
        "scope": scope,
        "num_rooms": num_rooms,
        "harmony": harmony,
    }
    files = {"image": image_file} if image_file else None

    try:
        resp = requests.post(
            f"{settings.ML_SERVICE_URL}/api/analyse",
            data=data,
            files=files,
            timeout=ML_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        raise MLServiceError(f"ml service unreachable or errored: {exc}") from exc


def generate_room_image(payload: dict):
    try:
        resp = requests.post(
            f"{settings.ML_SERVICE_URL}/api/generate-image",
            json=payload,
            timeout=ML_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        raise MLServiceError(f"ml service unreachable or errored: {exc}") from exc
