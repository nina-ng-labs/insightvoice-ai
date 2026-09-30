# InsightVoice AI

**Voice-Driven Business Investigation Agent**

InsightVoice is an AI-powered analytics application that allows users to investigate business performance using natural language and voice.

Instead of navigating dashboards manually, users can ask business questions such as:

> "Why did revenue increase in February?"

InsightVoice converts the question into an analytical workflow, selects the appropriate analytics tool, retrieves evidence from the dataset, and produces a structured **Insight Brief** with findings, supporting evidence, confidence, limitations, and recommended actions.

## Hackathon Project

Built for the **AssemblyAI Voice Agent Hackathon — September 2026**.

The project explores how voice interfaces can move beyond transcription and become an interface for real business investigation.

## Core Investigation Scenarios

### 1. Revenue Root-Cause Analysis

Investigates changes in revenue between periods.

The agent analyzes:

- Revenue / GMV
- Order volume
- Average Order Value
- Period-over-period growth
- Category contribution
- Seller contribution

Example finding:

> Revenue growth was primarily driven by higher order volume rather than higher average order value.

### 2. Seller Driver Analysis

Identifies which sellers contributed most to business performance.

The investigation can analyze:

- Seller GMV
- Seller contribution
- Top-performing sellers
- Seller concentration
- Changes between periods

### 3. Transaction Anomaly Detection

Detects unusual transactions and patterns that may require investigation.

The agent can surface:

- Unusually large transactions
- Unexpected transaction patterns
- Potential data anomalies
- Transactions requiring further review

## Insight Brief

Instead of returning only raw metrics, InsightVoice produces a structured analytical response:

**Claim**  
What the analysis indicates.

**Evidence**  
Metrics and observations supporting the claim.

**Confidence**  
How strongly the available data supports the conclusion.

**Limitation**  
Important constraints or missing information.

**Recommendation**  
Suggested next analytical or business action.

## How It Works

```text
User Voice / Question
        ↓
Voice Transcription
        ↓
InsightVoice Agent
        ↓
Tool Selection
        ↓
Analytics Functions
        ↓
Olist Dataset
        ↓
Evidence
        ↓
Insight Brief
```

The analytical layer includes functions for:

```text
get_period_metrics()
get_period_comparison()
get_category_contribution()
get_seller_contribution()
get_anomaly_transactions()
```

This creates an **Agent → Tool → Evidence → Insight** pipeline rather than relying on an LLM to generate unsupported business conclusions.

## Dataset

The business investigation demo uses the **Olist Brazilian E-Commerce Public Dataset**.

The dataset contains marketplace information including:

- Orders
- Order items
- Products
- Sellers
- Customers
- Payments
- Reviews

It provides a realistic environment for testing business analytics and AI-assisted investigation workflows.

## Example Analysis

For an early-period comparison in the Olist dataset:

```text
January 2017 GMV: 120,098.27
February 2017 GMV: 244,959.35

GMV Growth: +109.5%
Order Growth: +120.4%
AOV Change: -4.9%
```

The evidence indicates that growth was driven primarily by **increased order volume**, rather than customers spending more per order.

## Tech Stack

### Frontend

- React Native
- Expo
- TypeScript
- Expo Router

### AI / Voice

- AssemblyAI
- Voice transcription
- Natural-language business investigation

### Analytics Backend

- Python
- FastAPI
- Pandas
- REST API

### Supporting Server

- Node.js
- Express

## Project Structure

```text
insightvoice-ai/
│
├── app/
│   ├── _layout.tsx
│   ├── analytics.tsx
│   ├── confirm.tsx
│   ├── history.tsx
│   ├── index.tsx
│   ├── more.tsx
│   ├── olist.tsx
│   └── source.tsx
│
├── assets/
│
├── components/
│   └── BottomNav.tsx
│
├── olist_backend/
│   ├── data/
│   ├── tools/
│   ├── api.py
│   ├── requirements.txt
│   └── test_olist.py
│
├── server/
│   └── server.js
│
├── utils/
│   └── storage.ts
│
├── app.json
├── eas.json
├── index.ts
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Design Principle

InsightVoice follows a simple principle:

> **AI should not invent the insight — it should investigate the evidence.**

The agent uses deterministic analytical tools to calculate business metrics before generating an explanation.

This helps separate:

```text
Question
→ Calculation
→ Evidence
→ Interpretation
→ Recommendation
```

and makes AI-generated business analysis easier to inspect and validate.

## Goal

InsightVoice demonstrates how conversational AI can become an analytical interface for business users.

Instead of asking users to learn SQL, navigate complex dashboards, or manually compare multiple charts, the system allows them to ask a question naturally and receive an evidence-backed investigation.

---

Built as a hackathon project and data analytics portfolio project.