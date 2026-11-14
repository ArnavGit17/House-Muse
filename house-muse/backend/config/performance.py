import json
import logging
import uuid
from contextvars import ContextVar
from time import perf_counter


_logger = logging.getLogger("house_muse.performance")
_logger.setLevel(logging.INFO)
if not _logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_handler)
_logger.propagate = False
_request_id = ContextVar("house_muse_request_id", default=None)
_request_metrics = ContextVar("house_muse_request_metrics", default=None)


def begin_request(request_id: str):
    return _request_id.set(request_id), _request_metrics.set({})


def end_request(tokens) -> None:
    request_id_token, metrics_token = tokens
    _request_metrics.reset(metrics_token)
    _request_id.reset(request_id_token)


def get_request_id():
    return _request_id.get()


def record_duration(metric_name: str, duration_seconds: float, **fields) -> None:
    duration = float(duration_seconds)
    request_id = get_request_id()
    event = {
        "event": "latency",
        "metric": metric_name,
        "duration_seconds": duration,
    }
    if request_id:
        event["request_id"] = request_id
    event.update(fields)
    _logger.info(json.dumps(event, separators=(",", ":"), sort_keys=True))

    metrics = _request_metrics.get()
    if metrics is not None:
        metrics[metric_name] = duration


def record_reported_metric(metric_name: str, duration_seconds: float) -> None:
    metrics = _request_metrics.get()
    if metrics is not None:
        metrics[metric_name] = float(duration_seconds)


def current_metrics() -> dict:
    metrics = _request_metrics.get()
    return dict(metrics) if metrics is not None else {}


class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _request_id(request) -> str:
        candidate = request.headers.get("X-Request-ID", "")
        try:
            return str(uuid.UUID(candidate))
        except (ValueError, AttributeError, TypeError):
            return str(uuid.uuid4())

    def __call__(self, request):
        if not request.path.startswith("/api/"):
            return self.get_response(request)

        request_id = self._request_id(request)
        tokens = begin_request(request_id)
        started_at = perf_counter()
        response = None
        try:
            response = self.get_response(request)
            return response
        finally:
            duration = perf_counter() - started_at
            record_duration(
                "django.api_response_seconds",
                duration,
                status_code=response.status_code if response is not None else None,
            )
            if response is not None:
                response["X-HouseMuse-Request-ID"] = request_id
                response["X-HouseMuse-Django-API-Seconds"] = f"{duration:.9f}"
                response_headers = {
                    "django.flask_round_trip_seconds": "X-HouseMuse-Django-Flask-Round-Trip-Seconds",
                    "django.flask_transport_overhead_seconds": "X-HouseMuse-Django-Flask-Overhead-Seconds",
                    "ml.api_response_seconds": "X-HouseMuse-ML-API-Seconds",
                    "ml.room_analysis_execution_seconds": "X-HouseMuse-Room-Analysis-Seconds",
                    "ml.image_processing_pipeline_seconds": "X-HouseMuse-Image-Processing-Seconds",
                    "ml.yolo_inference_seconds": "X-HouseMuse-YOLO-Inference-Seconds",
                    "ml.object_color_extraction_seconds": "X-HouseMuse-Object-Color-Extraction-Seconds",
                    "ml.dominant_color_extraction_seconds": "X-HouseMuse-Dominant-Color-Extraction-Seconds",
                    "ml.image_generation_execution_seconds": "X-HouseMuse-Image-Generation-Seconds",
                    "ml.image_generation_provider_round_trip_seconds": "X-HouseMuse-Image-Generation-Provider-Seconds",
                    "ml.image_refinement_execution_seconds": "X-HouseMuse-Image-Refinement-Seconds",
                    "ml.image_refinement_provider_round_trip_seconds": "X-HouseMuse-Image-Refinement-Provider-Seconds",
                    "ml.provider_depth_estimation_seconds": "X-HouseMuse-Provider-Depth-Estimation-Seconds",
                    "ml.provider_diffusion_inference_seconds": "X-HouseMuse-Provider-Diffusion-Inference-Seconds",
                    "ml.provider_model_execution_seconds": "X-HouseMuse-Provider-Model-Execution-Seconds",
                }
                for metric_name, header_name in response_headers.items():
                    value = current_metrics().get(metric_name)
                    if value is not None:
                        response[header_name] = f"{value:.9f}"
            end_request(tokens)
