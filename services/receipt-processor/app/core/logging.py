import logging


def configure_logging(level: str) -> None:
    """Configure structured-enough application logging without secrets."""
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
