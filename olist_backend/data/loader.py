"""
data/loader.py
Loads the six core Olist CSV files into pandas DataFrames.

Usage:
    from data.loader import load_olist_data

    data = load_olist_data()
    orders_df = data["orders"]
"""

from pathlib import Path
import pandas as pd


# ── Where the CSV files live ──────────────────────────────────────────────────
#
# __file__  = .../insightvoice/data/loader.py
# .parent   = .../insightvoice/data/
# DATA_DIR  = .../insightvoice/data/
#
DATA_DIR = Path(__file__).parent


# ── The six CSV files InsightVoice needs ──────────────────────────────────────
#
# Each entry maps a short friendly name to the actual CSV filename.
# The short name becomes the dictionary key returned to the caller.
#
OLIST_FILES: dict[str, str] = {
    "orders":       "olist_orders_dataset.csv",
    "order_items":  "olist_order_items_dataset.csv",
    "products":     "olist_products_dataset.csv",
    "sellers":      "olist_sellers_dataset.csv",
    "customers":    "olist_customers_dataset.csv",
    "payments":     "olist_order_payments_dataset.csv",
}


# ── Datetime columns to convert per table ─────────────────────────────────────
#
# These are the timestamp columns we know exist in the Olist schema.
# Converting them now means analytical code can immediately do date filtering
# without having to remember to parse strings later.
#
DATETIME_COLUMNS: dict[str, list[str]] = {
    "orders": [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ],
    "order_items": [
        "shipping_limit_date",
    ],
}


def _convert_datetime_columns(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    """
    Convert known timestamp columns to pandas datetime type.

    This is a technical step — we are not calculating anything,
    just changing the column type so date comparisons work later.

    Parameters
    ----------
    df         : The DataFrame to modify.
    table_name : Used to look up which columns to convert.

    Returns
    -------
    The same DataFrame with datetime columns properly typed.
    """
    columns_to_convert = DATETIME_COLUMNS.get(table_name, [])

    for col in columns_to_convert:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
            # errors="coerce" turns unparseable values into NaT (not-a-time)
            # instead of crashing. NaT behaves like NaN for datetime columns.

    return df


def load_olist_data() -> dict[str, pd.DataFrame]:
    """
    Load the six core Olist CSV files from the data/ directory.

    Returns a dictionary with one DataFrame per table:

        {
            "orders":      pd.DataFrame,
            "order_items": pd.DataFrame,
            "products":    pd.DataFrame,
            "sellers":     pd.DataFrame,
            "customers":   pd.DataFrame,
            "payments":    pd.DataFrame,
        }

    Raises
    ------
    FileNotFoundError
        If one or more required CSV files are missing from data/.
        The error message lists every missing file so you can fix
        them all at once instead of discovering them one by one.

    Notes
    -----
    - Paths are relative to this file, so the loader works regardless
      of which directory you run Python from.
    - Datetime columns are converted automatically (see DATETIME_COLUMNS).
    - No analytical calculations are performed here.
    """

    # Step 1: Check for missing files before loading anything.
    #         It is better to report all missing files at once than to
    #         load three files and then crash on the fourth.
    missing_files = []
    for friendly_name, filename in OLIST_FILES.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            missing_files.append(f"  • {filename}  (needed for '{friendly_name}')")

    if missing_files:
        missing_list = "\n".join(missing_files)
        raise FileNotFoundError(
            f"\n\nInsightVoice could not find the following Olist CSV files:\n"
            f"{missing_list}\n\n"
            f"Please download the Olist Brazilian Ecommerce dataset from Kaggle\n"
            f"and place the CSV files in:  {DATA_DIR}\n"
            f"https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce"
        )

    # Step 2: Load each CSV file into a DataFrame.
    data: dict[str, pd.DataFrame] = {}

    for friendly_name, filename in OLIST_FILES.items():
        filepath = DATA_DIR / filename
        df = pd.read_csv(filepath)
        df = _convert_datetime_columns(df, friendly_name)
        data[friendly_name] = df

    return data


def get_data_dir() -> Path:
    """Return the absolute path to the data/ directory.

    Useful for debugging or for code that needs to know where
    the data folder is without loading any files.
    """
    return DATA_DIR
