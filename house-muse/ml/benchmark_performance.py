"""Reproducible House Muse image-analysis and image-generation benchmarks."""

import argparse
import base64
import json
import math
import os
import statistics
import sys
import uuid
from pathlib import Path
from time import perf_counter

import requests


ANALYSIS_TRIALS = 20
GENERATION_SUCCESS_TARGET = 10
DEFAULT_IMAGE = (
    Path(__file__).resolve().parents[1]
    / "frontend"
    / "public"
    / "test"
    / "unfurnished room.jpeg"
)

METRIC_HEADERS = {
    "api_response_seconds": "X-HouseMuse-ML-API-Seconds",
    "room_analysis_seconds": "X-HouseMuse-Room-Analysis-Seconds",
    "image_processing_seconds": "X-HouseMuse-Image-Processing-Seconds",
    "yolo_inference_seconds": "X-HouseMuse-YOLO-Inference-Seconds",
    "object_color_extraction_seconds": "X-HouseMuse-Object-Color-Extraction-Seconds",
    "dominant_color_extraction_seconds": "X-HouseMuse-Dominant-Color-Extraction-Seconds",
    "image_generation_seconds": "X-HouseMuse-Image-Generation-Seconds",
    "image_generation_provider_round_trip_seconds": "X-HouseMuse-Image-Generation-Provider-Seconds",
    "image_refinement_seconds": "X-HouseMuse-Image-Refinement-Seconds",
    "image_refinement_provider_round_trip_seconds": "X-HouseMuse-Image-Refinement-Provider-Seconds",
    "provider_depth_estimation_seconds": "X-HouseMuse-Provider-Depth-Estimation-Seconds",
    "provider_diffusion_inference_seconds": "X-HouseMuse-Provider-Diffusion-Inference-Seconds",
    "provider_model_execution_seconds": "X-HouseMuse-Provider-Model-Execution-Seconds",
    "django_api_response_seconds": "X-HouseMuse-Django-API-Seconds",
    "django_flask_round_trip_seconds": "X-HouseMuse-Django-Flask-Round-Trip-Seconds",
    "django_flask_overhead_seconds": "X-HouseMuse-Django-Flask-Overhead-Seconds",
}


def _read_metric_headers(response) -> dict:
    metrics = {}
    for metric, header in METRIC_HEADERS.items():
        value = response.headers.get(header)
        if value is None:
            continue
        try:
            duration = float(value)
        except ValueError:
            raise ValueError(f"Invalid timing value in response header for {metric}.")
        if not math.isfinite(duration) or duration < 0:
            raise ValueError(f"Non-finite or negative timing value in response header for {metric}.")
        metrics[metric] = duration
    return metrics


def _analysis_form(room_type: str, style: str) -> dict:
    return {
        "room_type": room_type,
        "length": "5.4",
        "width": "4.2",
        "height": "3.0",
        "styles": json.dumps([style]),
        "budget": "180000",
        "scope": "interior_design",
        "num_rooms": "1",
        "harmony": "analogous",
        "save": "false",
    }


def _post_photo(url, image_path, image_bytes, data, timeout, token=None):
    headers = {"X-Request-ID": str(uuid.uuid4())}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    started_at = perf_counter()
    response = requests.post(
        url,
        data=data,
        files={"image": (image_path.name, image_bytes, "image/jpeg")},
        headers=headers,
        timeout=timeout,
    )
    client_seconds = perf_counter() - started_at
    return response, client_seconds


def _print_trial_table(title: str, rows: list[dict], metric_names: list[str]) -> None:
    print(f"\n{title} - per-trial seconds")
    print("trial," + ",".join(metric_names))
    for index, row in enumerate(rows, start=1):
        values = [f"{row.get(metric, float('nan')):.6f}" if metric in row else "" for metric in metric_names]
        print(f"{index}," + ",".join(values))


def _summarize(rows: list[dict], metric_names: list[str]) -> None:
    print("\nMetric,Average,Median,Minimum,Maximum,P95 (seconds)")
    for metric in metric_names:
        values = sorted(row[metric] for row in rows if metric in row)
        if not values:
            print(f"{metric},unavailable,,,,")
            continue
        p95 = values[max(0, math.ceil(0.95 * len(values)) - 1)]
        print(
            f"{metric},{statistics.mean(values):.6f},{statistics.median(values):.6f},"
            f"{values[0]:.6f},{values[-1]:.6f},{p95:.6f}"
        )


def run_analysis(args, image_path: Path, image_bytes: bytes, token: str | None) -> None:
    base_url = args.django_url.rstrip("/") if args.django else args.ml_url.rstrip("/")
    endpoint = (
        f"{base_url}/studio/analyse/"
        if args.django
        else f"{base_url}/api/analyse"
    )
    data = _analysis_form(args.room_type, args.style)
    if args.django:
        data["save"] = "false"
        print("Warming the analysis pipeline once; warm-up is excluded from the 20 trials.")
        warmup, _ = _post_photo(endpoint, image_path, image_bytes, data, args.timeout, token)
    else:
        print("Warming the analysis pipeline once; warm-up is excluded from the 20 trials.")
        warmup, _ = _post_photo(endpoint, image_path, image_bytes, data, args.timeout)
    try:
        warmup_payload = warmup.json()
    except ValueError:
        warmup_payload = {}
    if not isinstance(warmup_payload, dict):
        warmup_payload = {}
    warmup_succeeded = (
        "result" in warmup_payload
        if args.django
        else warmup_payload.get("success") is True
    )
    if not warmup.ok or not warmup_succeeded:
        raise RuntimeError(f"Analysis warm-up failed with HTTP {warmup.status_code}; response body omitted.")

    rows = []
    for trial in range(1, ANALYSIS_TRIALS + 1):
        response, client_seconds = _post_photo(
            endpoint,
            image_path,
            image_bytes,
            data,
            args.timeout,
            token if args.django else None,
        )
        try:
            payload = response.json()
        except ValueError:
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        analysis_succeeded = (
            "result" in payload
            if args.django
            else payload.get("success") is True
        )
        if not response.ok or not analysis_succeeded:
            raise RuntimeError(
                f"Analysis trial {trial} failed with HTTP {response.status_code}; response body omitted."
            )
        row = _read_metric_headers(response)
        row["client_api_response_seconds"] = client_seconds
        rows.append(row)
        print(f"Analysis trial {trial}/{ANALYSIS_TRIALS} completed.")

    metric_names = [
        "client_api_response_seconds",
        "django_api_response_seconds",
        "django_flask_round_trip_seconds",
        "django_flask_overhead_seconds",
        "api_response_seconds",
        "room_analysis_seconds",
        "image_processing_seconds",
        "yolo_inference_seconds",
        "object_color_extraction_seconds",
        "dominant_color_extraction_seconds",
    ]
    _print_trial_table("Room analysis", rows, metric_names)
    _summarize(rows, metric_names)


def _generation_succeeded(response) -> bool:
    if not response.ok:
        return False
    try:
        payload = response.json()
    except ValueError:
        return False
    variants = payload.get("variants")
    if not payload.get("success") or not isinstance(variants, list) or not variants:
        return False
    first = variants[0]
    if not isinstance(first, dict) or not first.get("success"):
        return False
    image_b64 = payload.get("image_b64") or first.get("image_b64")
    image_url = payload.get("image_url") or first.get("image_url")
    if image_b64:
        try:
            return bool(base64.b64decode(image_b64, validate=True))
        except (ValueError, TypeError):
            return False
    return bool(image_url)


def run_generation(args, image_path: Path, image_bytes: bytes) -> bool:
    endpoint = f"{args.ml_url.rstrip('/')}/api/generate-image"
    form = {
        "room_type": args.room_type,
        "styles": json.dumps([args.style]),
        "wall_color": "#E2C89A",
        "accent_color": "#8A9E85",
        "dominant_colors": "[]",
        "size_category": "medium",
        "lighting": "bright",
        "detections": "[]",
        "n_variants": "1",
    }
    rows = []
    for attempts in range(1, GENERATION_SUCCESS_TARGET + 1):
        try:
            response, client_seconds = _post_photo(
                endpoint,
                image_path,
                image_bytes,
                form,
                args.generation_timeout,
            )
        except requests.RequestException:
            print(f"Generation attempt {attempts} failed at the HTTP layer; details omitted.")
            break
        if not _generation_succeeded(response):
            print(
                f"Generation attempt {attempts} did not return a successful image "
                f"(HTTP {response.status_code}); response body omitted."
            )
            break

        row = _read_metric_headers(response)
        row["client_api_response_seconds"] = client_seconds
        rows.append(row)
        print(f"Successful image generation {len(rows)}/{GENERATION_SUCCESS_TARGET}.")

    metric_names = [
        "client_api_response_seconds",
        "api_response_seconds",
        "image_generation_seconds",
        "image_generation_provider_round_trip_seconds",
        "provider_depth_estimation_seconds",
        "provider_diffusion_inference_seconds",
        "provider_model_execution_seconds",
    ]
    if len(rows) == GENERATION_SUCCESS_TARGET:
        _print_trial_table("Image generation", rows, metric_names)
        _summarize(rows, metric_names)
        return True

    print(
        f"Image-generation benchmark incomplete: {len(rows)}/{GENERATION_SUCCESS_TARGET} "
        f"successful trials after {attempts} attempt(s). No generation summary calculated."
    )
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("all", "analysis", "generation"), default="all")
    parser.add_argument("--ml-url", default="http://127.0.0.1:5000")
    parser.add_argument("--django", action="store_true", help="Run analysis through authenticated Django instead of Flask.")
    parser.add_argument("--django-url", default="http://127.0.0.1:8000/api")
    parser.add_argument("--image", type=Path, default=DEFAULT_IMAGE)
    parser.add_argument("--room-type", default="living_room")
    parser.add_argument("--style", default="contemporary_indian")
    parser.add_argument("--timeout", type=float, default=300)
    parser.add_argument("--generation-timeout", type=float, default=360)
    args = parser.parse_args()

    if not args.image.is_file():
        parser.error(f"Room photo not found: {args.image}")

    token = None
    if args.django:
        token = os.environ.get("HOUSE_MUSE_BENCHMARK_TOKEN")
        if not token:
            from getpass import getpass
            token = getpass("Knox token (input hidden): ")
        if not token:
            parser.error("Django analysis requires a Knox token.")

    image_bytes = args.image.read_bytes()
    if args.mode in ("all", "analysis"):
        run_analysis(args, args.image, image_bytes, token)

    if args.mode in ("all", "generation"):
        if not run_generation(args, args.image, image_bytes):
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
