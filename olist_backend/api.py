from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data.loader import load_olist_data
from tools.analytics import (
    get_period_metrics,
    get_period_comparison,
    get_category_contribution,
    get_seller_contribution,
    get_transaction_anomalies,
)

app = FastAPI(
    title="InsightVoice Olist API",
    version="1.0.0",
)

# Allow Expo / web frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Load Olist data ONCE when backend starts
# ---------------------------------------------------------

print("Loading Olist dataset...")

try:
    data = load_olist_data()
    print("✅ Olist dataset loaded")
except Exception as exc:
    print("❌ Failed to load Olist dataset:", exc)
    raise


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def clean(value):
    """
    Convert pandas / numpy objects into JSON-safe Python objects.
    """

    # pandas DataFrame
    if hasattr(value, "to_dict") and hasattr(value, "columns"):
        return clean(value.to_dict(orient="records"))

    # pandas Series
    if hasattr(value, "to_dict") and hasattr(value, "index"):
        return clean(value.to_dict())

    # numpy scalar: np.int64, np.float64, etc.
    if hasattr(value, "item"):
        return value.item()

    if isinstance(value, dict):
        return {
            key: clean(val)
            for key, val in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            clean(item)
            for item in value
        ]

    return value


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "InsightVoice Olist API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "dataset": "Olist Brazilian E-commerce",
        "tables": list(data.keys()),
    }


# ---------------------------------------------------------
# Scenario 1
# Revenue Root-Cause
# ---------------------------------------------------------

@app.get("/api/olist/revenue")
def revenue_root_cause(
    current_start: str = "2017-02-01",
    current_end: str = "2017-02-28",
    previous_start: str = "2017-01-01",
    previous_end: str = "2017-01-31",
):
    try:
        comparison = get_period_comparison(
            data,
            current_start=current_start,
            current_end=current_end,
            previous_start=previous_start,
            previous_end=previous_end,
        )

        categories = get_category_contribution(
            data,
            start_date=current_start,
            end_date=current_end,
        )

        return clean({
            "scenario": "revenue_root_cause",
            "period": {
                "current_start": current_start,
                "current_end": current_end,
                "previous_start": previous_start,
                "previous_end": previous_end,
            },
            "comparison": comparison,
            "top_categories": categories[:5],
        })

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ---------------------------------------------------------
# Scenario 2
# Seller Driver
# ---------------------------------------------------------

@app.get("/api/olist/sellers")
def seller_driver(
    start_date: str = "2017-02-01",
    end_date: str = "2017-02-28",
    top_n: int = 5,
):
    try:
        result = get_seller_contribution(
            data,
            start_date=start_date,
            end_date=end_date,
            top_n=top_n,
        )

        return clean({
            "scenario": "seller_driver",
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "sellers": result,
        })

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ---------------------------------------------------------
# Scenario 3
# Transaction Anomaly
# ---------------------------------------------------------

@app.get("/api/olist/anomalies")
def transaction_anomaly(
    start_date: str = "2017-02-01",
    end_date: str = "2017-02-28",
):
    try:
        result = get_transaction_anomalies(
            data,
            start_date=start_date,
            end_date=end_date,
        )

        return clean({
            "scenario": "transaction_anomaly",
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "anomalies": result,
        })

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )