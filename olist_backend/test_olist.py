from data.loader import load_olist_data
from tools.analytics import get_period_metrics, get_period_comparison

print("Loading Olist data...")

data = load_olist_data()

print("Loaded:", list(data.keys()))

metrics = get_period_metrics(
    data,
    "2017-01-01",
    "2017-01-31",
)

print("\nJanuary 2017:")
print(metrics)

comparison = get_period_comparison(
    data,
    current_start="2017-02-01",
    current_end="2017-02-28",
    previous_start="2017-01-01",
    previous_end="2017-01-31",
)

print("\nJan → Feb comparison:")
print(comparison)

print("\n✅ Olist analytics works")