"""
tools/analytics.py
Analytical tool interfaces for InsightVoice.

Each function here is a SKELETON — the signature, parameters, type hints,
and docstring are defined, but the implementation is intentionally empty.

YOU will implement the analytical logic inside these functions.

The investigation agent will call these functions in future milestones.

Nothing in this file computes revenue, growth, averages, anomalies,
or any business metric. That work belongs to you.
"""

import pandas as pd


# ── Type alias ────────────────────────────────────────────────────────────────
#
# OlistData is just a shorter way to write dict[str, pd.DataFrame].
# It represents the dictionary returned by load_olist_data().
#
OlistData = dict[str, pd.DataFrame]

def _prepare_period_orders(
    data: OlistData,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """
    Prepare non-cancelled Olist orders for a date range.
    """

    start = pd.to_datetime(start_date)
    end_date_parsed = pd.to_datetime(end_date)

    if start > end_date_parsed:
        raise ValueError(
            "start_date must be before or equal to end_date"
        )

    orders = data["orders"].copy()

    orders["order_purchase_timestamp"] = pd.to_datetime(
        orders["order_purchase_timestamp"]
    )

    # Exclude cancelled orders
    orders = orders[
        orders["order_status"] != "canceled"
    ]

    # Inclusive end date
    end = end_date_parsed + pd.Timedelta(days=1)

    period_orders = orders[
        (orders["order_purchase_timestamp"] >= start)
        & (orders["order_purchase_timestamp"] < end)
    ].copy()

    return period_orders

# =============================================================================
# TOOL 1 — Period Metrics
# =============================================================================

def get_period_metrics(
    data: OlistData,
    start_date: str,
    end_date: str,
) -> dict:
    """
    Compute summary metrics for a given date range.

    YOU will implement the metric calculations inside this function.

    Parameters
    ----------
    data       : dict returned by load_olist_data()
    start_date : Start of the period, inclusive. Format: "YYYY-MM-DD"
    end_date   : End of the period, inclusive.   Format: "YYYY-MM-DD"

    Returns
    -------
    A dictionary. The exact structure is yours to design, but a useful
    starting point might look like:

        {
            "period_start":  str,
            "period_end":    str,
            "order_count":   int,
            "revenue_total": float,
            "aov":           float,   # average order value
        }

    Notes
    -----
    - Filter orders by order_purchase_timestamp.
    - Join order_items to get price and freight_value.
    - Do not include cancelled orders unless you decide otherwise.
    - Raise ValueError if start_date > end_date.
    """
    start = pd.to_datetime(start_date)
    end_date_parsed = pd.to_datetime(end_date)

    if start > end_date_parsed:
        raise ValueError("start_date must be before or equal to end_date")

    orders = data["orders"]

    orders["order_purchase_timestamp"] = pd.to_datetime(
        orders["order_purchase_timestamp"]
    )

    orders = orders[
        orders["order_status"] != "canceled"
    ]

    end = end_date_parsed + pd.Timedelta(days=1)

    period_orders = orders[
        (orders["order_purchase_timestamp"] >= start)
        &
        (orders["order_purchase_timestamp"] < end)
    ]

    order_items = data["order_items"]

    period_items = period_orders.merge(
        order_items,
        on="order_id"
    )

    revenue = period_items["price"].sum()

    order_count = period_items["order_id"].nunique()

    aov = revenue / order_count if order_count > 0 else 0
    return {
        "revenue": revenue,
        "order_count": order_count,
        "aov": aov,
    }


# =============================================================================
# TOOL 2 — Period-over-Period Comparison
# =============================================================================

def get_period_comparison(
    data: OlistData,
    current_start: str,
    current_end: str,
    previous_start: str,
    previous_end: str,
) -> dict:
    """
    Compare metrics between two time periods.

    YOU will implement the comparison logic inside this function.

    A natural implementation would call get_period_metrics() twice —
    once for each period — and then compare the results.

    Parameters
    ----------
    data           : dict returned by load_olist_data()
    current_start  : Start of the current period.  Format: "YYYY-MM-DD"
    current_end    : End of the current period.    Format: "YYYY-MM-DD"
    previous_start : Start of the previous period. Format: "YYYY-MM-DD"
    previous_end   : End of the previous period.   Format: "YYYY-MM-DD"

    Returns
    -------
    A dictionary. A useful structure might look like:

        {
            "current":  dict,   # result from get_period_metrics() for current
            "previous": dict,   # result from get_period_metrics() for previous
            "delta": {
                "revenue_change":        float,
                "revenue_change_pct":    float,
                "order_count_change":    int,
                "order_count_change_pct": float,
            }
        }
    """
    current = get_period_metrics(
        data,
        current_start,
        current_end
    )

    previous = get_period_metrics(
        data,
        previous_start,
        previous_end
    )

    revenue_change = (
        current["revenue"]
        - previous["revenue"]
    )

    revenue_change_pct = (
        revenue_change / previous["revenue"] * 100
        if previous["revenue"] > 0
        else 0
    )
    order_count_change = (
        current["order_count"]
        - previous["order_count"]
    )

    order_count_change_pct = (
        order_count_change / previous["order_count"] * 100
        if previous["order_count"] > 0
        else 0
    )

    return {
        "current": current,
        "previous": previous,
        "delta": {
            "revenue_change": revenue_change,
            "revenue_change_pct": revenue_change_pct,
            "order_count_change": order_count_change,
            "order_count_change_pct": order_count_change_pct,
        }
    }



# =============================================================================
# TOOL 3 — Category Contribution
# =============================================================================

def get_category_contribution(
    data: OlistData,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """
    Break down a period's metrics by product category.

    YOU will implement the breakdown logic inside this function.

    Parameters
    ----------
    data       : dict returned by load_olist_data()
    start_date : Start of the period. Format: "YYYY-MM-DD"
    end_date   : End of the period.   Format: "YYYY-MM-DD"

    Returns
    -------
    A DataFrame with one row per category. A useful structure might be:

        product_category_name | order_count | revenue | revenue_share_pct
        ──────────────────────|─────────────|─────────|──────────────────
        electronics           | 1200        | 48000.0 | 32.1
        ...

    Notes
    -----
    - You will need to join order_items → products to get the category name.
    - Filter by the date range using orders.order_purchase_timestamp.
    - Sort by revenue descending so the top categories appear first.
    """
    start = pd.to_datetime(start_date)
    end_date_parsed = pd.to_datetime(end_date)

    if start > end_date_parsed:
        raise ValueError("start_date must be before or equal to end_date")

    orders = data["orders"].copy()
    order_items = data["order_items"]
    products = data["products"]

    orders["order_purchase_timestamp"] = pd.to_datetime(
        orders["order_purchase_timestamp"]
    )

    # Exclude cancelled orders
    orders = orders[
        orders["order_status"] != "canceled"
    ]

    # Inclusive date range
    end = end_date_parsed + pd.Timedelta(days=1)

    period_orders = orders[
        (orders["order_purchase_timestamp"] >= start)
        &
        (orders["order_purchase_timestamp"] < end)
    ][["order_id"]]

    # Join orders → items → products
    period_items = period_orders.merge(
        order_items,
        on="order_id",
        how="inner",
    )

    period_items = period_items.merge(
        products[["product_id", "product_category_name"]],
        on="product_id",
        how="left",
    )

    # Keep missing categories visible instead of silently dropping them
    period_items["product_category_name"] = (
        period_items["product_category_name"]
        .fillna("unknown")
    )

    # Aggregate by category
    category_summary = (
        period_items
        .groupby("product_category_name", as_index=False)
        .agg(
            order_count=("order_id", "nunique"),
            revenue=("price", "sum"),
        )
    )

    total_revenue = category_summary["revenue"].sum()

    category_summary["revenue_share_pct"] = (
        category_summary["revenue"] / total_revenue * 100
        if total_revenue > 0
        else 0.0
    )

    category_summary = (
        category_summary
        .sort_values("revenue", ascending=False)
        .reset_index(drop=True)
    )

    return category_summary


# =============================================================================
# TOOL 4 — Seller Contribution
# =============================================================================

def get_seller_contribution(
    data: OlistData,
    start_date: str,
    end_date: str,
    top_n: int = 20,
) -> pd.DataFrame:
    """
    Break down a period's metrics by seller.

    YOU will implement the breakdown logic inside this function.

    Parameters
    ----------
    data       : dict returned by load_olist_data()
    start_date : Start of the period. Format: "YYYY-MM-DD"
    end_date   : End of the period.   Format: "YYYY-MM-DD"
    top_n      : Return only the top N sellers by revenue. Default is 20.

    Returns
    -------
    A DataFrame with one row per seller. A useful structure might be:

        seller_id | order_count | revenue | revenue_share_pct
        ──────────|─────────────|─────────|──────────────────
        abc123    | 240         | 9600.0  | 6.4
        ...

    Notes
    -----
    - Join order_items → sellers to get seller metadata.
    - Filter by the date range using orders.order_purchase_timestamp.
    - Sort by revenue descending.
    - Apply top_n limit after sorting.
    """
    start = pd.to_datetime(start_date)
    end_date_parsed = pd.to_datetime(end_date)

    if start > end_date_parsed:
        raise ValueError("start_date must be before or equal to end_date")

    if top_n <= 0:
        raise ValueError("top_n must be greater than 0")

    orders = data["orders"].copy()
    order_items = data["order_items"]

    orders["order_purchase_timestamp"] = pd.to_datetime(
        orders["order_purchase_timestamp"]
    )

    # Exclude cancelled orders
    orders = orders[
        orders["order_status"] != "canceled"
    ]

    # Inclusive date range
    end = end_date_parsed + pd.Timedelta(days=1)

    period_orders = orders[
        (orders["order_purchase_timestamp"] >= start)
        &
        (orders["order_purchase_timestamp"] < end)
    ][["order_id"]]

    # Join orders → order items.
    # seller_id is already present in the Olist order_items table,
    # so no sellers-table join is required for this aggregation.
    period_items = period_orders.merge(
        order_items,
        on="order_id",
        how="inner",
    )

    # Aggregate revenue and unique orders by seller
    seller_summary = (
        period_items
        .groupby("seller_id", as_index=False)
        .agg(
            order_count=("order_id", "nunique"),
            revenue=("price", "sum"),
        )
    )

    # IMPORTANT:
    # Calculate share against ALL sellers before limiting to Top N.
    total_revenue = seller_summary["revenue"].sum()

    seller_summary["revenue_share_pct"] = (
        seller_summary["revenue"] / total_revenue * 100
        if total_revenue > 0
        else 0.0
    )

    seller_summary = (
        seller_summary
        .sort_values("revenue", ascending=False)
        .head(top_n)
        .reset_index(drop=True)
    )

    return seller_summary


# =============================================================================
# TOOL 5 — Transaction Anomalies
# =============================================================================

def get_transaction_anomalies(
    data: OlistData,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """
    Identify unusual transactions within a date range.

    YOU will implement the anomaly detection logic inside this function.

    Parameters
    ----------
    data       : dict returned by load_olist_data()
    start_date : Start of the period. Format: "YYYY-MM-DD"
    end_date   : End of the period.   Format: "YYYY-MM-DD"

    Returns
    -------
    A DataFrame of flagged transactions. A useful structure might be:

        order_id | order_date | revenue | anomaly_reason
        ─────────|────────────|─────────|───────────────
        xyz789   | 2018-01-15 | 9800.0  | High value
        ...

    Notes
    -----
    - You might flag transactions whose value is unusually high
      relative to typical orders (e.g. using percentile thresholds).
    - You might also flag orders with an unusually large number of items.
    - Consider whether cancelled orders should be included or excluded.
    """
    period_orders = _prepare_period_orders(
        data,
        start_date,
        end_date,
    )

    order_items = data["order_items"]

    period_items = period_orders[
        ["order_id", "order_purchase_timestamp"]
    ].merge(
        order_items,
        on="order_id",
        how="inner",
    )

    if period_items.empty:
        return pd.DataFrame(
            columns=[
                "order_id",
                "order_date",
                "revenue",
                "item_count",
                "threshold",
                "anomaly_reason",
            ]
        )

    order_summary = (
        period_items
        .groupby("order_id", as_index=False)
        .agg(
            order_date=("order_purchase_timestamp", "first"),
            revenue=("price", "sum"),
            item_count=("order_item_id", "count"),
        )
    )

    threshold = float(
        order_summary["revenue"].quantile(0.99)
    )

    anomalies = order_summary[
        order_summary["revenue"] >= threshold
    ].copy()

    anomalies["threshold"] = threshold
    anomalies["anomaly_reason"] = (
        "Order revenue at or above period P99"
    )

    return (
        anomalies
        .sort_values("revenue", ascending=False)
        .reset_index(drop=True)
    )
