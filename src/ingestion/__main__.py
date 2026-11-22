"""Allow ``python -m src.ingestion.preprocess`` via package helpers.

Prefer: ``python -m src.ingestion.preprocess``
Also:   ``python -m src.ingestion`` runs preprocess.
"""

from src.ingestion.preprocess import main

if __name__ == "__main__":
    raise SystemExit(main())
