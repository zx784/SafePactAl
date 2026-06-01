import logging
import sys


def setup_logging(log_level: str = "INFO") -> None:
    level = getattr(logging, log_level.upper(), logging.INFO)

    # On Windows the console is cp1252 by default; log lines / tracebacks that
    # contain Unicode (e.g. the "→" in our docstrings) otherwise crash the log
    # handler with UnicodeEncodeError and can mask the real error. Force UTF-8
    # with a safe fallback so logging never raises.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")  # type: ignore[attr-defined]
    except Exception:
        pass

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Reduce noise from third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
