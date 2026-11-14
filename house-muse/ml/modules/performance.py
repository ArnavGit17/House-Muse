import json
import logging
from functools import wraps
from time import perf_counter

from flask import g, has_request_context


_logger = logging.getLogger("house_muse.performance")
_logger.setLevel(logging.INFO)
if not _logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_handler)
_logger.propagate = False


def record_duration(metric_name: str, duration_seconds: float, *, aggregate: bool = False, **fields) -> None:
    duration = float(duration_seconds)
    request_id = getattr(g, "house_muse_request_id", None) if has_request_context() else None
    event = {
        "event": "latency",
        "metric": metric_name,
        "duration_seconds": duration,
    }
    if request_id:
        event["request_id"] = request_id
    event.update(fields)
    _logger.info(json.dumps(event, separators=(",", ":"), sort_keys=True))

    if has_request_context():
        metrics = getattr(g, "house_muse_metrics", None)
        if metrics is not None:
            if aggregate:
                metrics[metric_name] = metrics.get(metric_name, 0.0) + duration
            else:
                metrics[metric_name] = duration


def timed(metric_name: str):
    def decorate(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            started_at = perf_counter()
            try:
                return function(*args, **kwargs)
            finally:
                record_duration(metric_name, perf_counter() - started_at)

        return wrapped

    return decorate
