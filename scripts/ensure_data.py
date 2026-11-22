"""Ensure processed restaurant parquet exists (bake or preprocess fallback)."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("ensure_data")


def main() -> int:
    from src.config import get_settings

    settings = get_settings()
    path = settings.processed_data_path
    if path.exists() and path.stat().st_size > 0:
        logger.info("Processed data present: %s (%s bytes)", path, path.stat().st_size)
        return 0

    logger.warning("Processed data missing at %s — running preprocess", path)
    from src.ingestion.preprocess import main as preprocess_main

    code = preprocess_main()
    if code != 0:
        logger.error("Preprocess failed with code %s", code)
        return code
    if not path.exists():
        logger.error("Preprocess finished but %s still missing", path)
        return 1
    logger.info("Processed data ready: %s", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
