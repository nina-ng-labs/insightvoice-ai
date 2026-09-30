# InsightVoice 🎙️

### Ask the business, not the dashboard.

**InsightVoice** is a voice-driven analytics assistant built for the **AssemblyAI Voice Agent Hackathon 2026**.

It turns natural-language questions into structured, evidence-backed insights — from personal spending to e-commerce business performance.

🌐 **Live Demo:** https://insightvoice-ai.netlify.app  
👩‍💻 **Built by:** [Nina Ng](https://github.com/nina-ng-labs)

---

## 🎯 What is InsightVoice?

Most analytics tools require users to navigate dashboards, configure filters, or write queries before they can answer a simple business question.

InsightVoice explores a different interaction model:

> **Ask the business, not the dashboard.**

Users can speak or type a question, and InsightVoice transforms it into a structured investigation backed by calculated metrics and real data.

The project contains two complementary experiences:

1. **Personal Transaction Intelligence**
2. **Business Investigation using the Olist E-commerce dataset**

---

## 🎙️ 1. Personal Transaction Intelligence

InsightVoice provides multiple ways to capture everyday transactions.

### Voice

Users can describe an expense naturally by voice.

The personal transaction flow supports both **English and Vietnamese voice input**.

Example:

> “I spent 195,000 VND on lunch at Van Hoa restaurant.”

The application transcribes and interprets the request, then prepares structured transaction fields for review.

### Receipt Scan

Users can upload a receipt and convert it into structured transaction information such as:

- Amount
- Currency
- Description
- Merchant / location
- Date
- Category

### Manual Entry

Transactions can also be entered manually when voice or receipt scanning is not appropriate.

### Personal Analytics

Saved transactions feed into the analytics experience, including:

- Total spending
- Category breakdown
- Spending trends
- Transaction history
- AI-assisted spending insights

---

## 📊 2. Business Investigation — Olist E-commerce

The second experience demonstrates how voice can become an interface for business analytics.

InsightVoice uses the **Olist Brazilian E-commerce dataset** as a real-world analytical environment.

Users can ask business questions using **voice or text**.

### Revenue Root-Cause

Example:

> “Why did revenue increase in February 2017 compared with January?”

InsightVoice compares the relevant periods and examines evidence such as:

- Revenue
- Order volume
- Average order value
- Category contribution

### Seller Driver

Example:

> “Which sellers contributed the most to GMV?”

The analytical tools identify leading seller contributions from the underlying dataset.

### Transaction Anomaly

Example:

> “Were there any unusual transactions?”

InsightVoice searches for unusual transaction patterns and surfaces supporting evidence for further investigation.

---

## 🧠 Evidence-Backed Insight Briefs

InsightVoice is designed to avoid returning only a generic AI-generated answer.

Business investigations produce a structured **Insight Brief** containing:

- **Claim**
- **Calculated evidence**
- **Key takeaways**
- **Recommendation**
- **Confidence context**
- **Data source**

This makes the analytical reasoning easier to inspect and verify.

---

## 🔄 How It Works

```text
Voice / Text Question
        ↓
AssemblyAI Transcription
        ↓
Intent Routing
        ↓
Analytical Tools
        ↓
Real Data / Calculated Metrics
        ↓
Evidence
        ↓
Insight Brief
```

For voice interactions, **AssemblyAI provides the speech-to-text layer** that converts spoken questions into transcripts before they enter the investigation pipeline.

---

## 🏗️ Architecture

InsightVoice combines a web/mobile-oriented frontend with separate backend services.

```text
┌──────────────────────────────┐
│      React Native / Expo     │
│        InsightVoice UI       │
└──────────────┬───────────────┘
               │
       Voice / Text / Receipt
               │
       ┌───────▼────────┐
       │ Node.js /      │
       │ Express API    │
       └───────┬────────┘
               │
    ┌──────────┼───────────┐
    │          │           │
AssemblyAI    Groq       Gemini
 Voice STT   Parsing     Receipt
    │
    └───────────────────────┐
                            │
                 ┌──────────▼──────────┐
                 │ Python / FastAPI    │
                 │ Olist Analytics     │
                 └──────────┬──────────┘
                            │
                     Analytical Tools
                            │
                     Evidence + Metrics
                            │
                       Insight Brief
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Voice transcription | AssemblyAI |
| Frontend | React Native / Expo / Expo Web |
| Application API | Node.js / Express |
| Business analytics API | Python / FastAPI |
| Language processing | Groq |
| Receipt extraction | Gemini |
| Business dataset | Olist Brazilian E-commerce |
| Frontend deployment | Netlify |
| Backend deployment | Render |

---

## 📂 Project Structure

```text
insightvoice-ai/
│
├── app/                 # Expo application screens
├── assets/              # Application assets
├── components/          # Shared UI components
├── olist_backend/       # FastAPI business analytics service
├── server/              # Node.js API and AI integrations
├── utils/               # Shared utilities
│
├── app.json
├── eas.json
├── index.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## 📈 Example Investigation

Question:

> **Why did revenue increase in February 2017 compared with January?**

InsightVoice calculates the underlying business metrics and returns an evidence-backed investigation.

Example findings from the project dataset:

| Metric | Result |
|---|---:|
| Revenue change | +104.0% |
| January revenue | $120,098 |
| February revenue | $244,959 |
| Order change | +118.3% |
| February AOV | ~$143 |

The resulting Insight Brief highlights that the increase in revenue coincided with substantially higher order volume, while also directing the user to inspect AOV and category contribution before attributing the change to a single cause.

---

## ✨ Core Features

- 🎙️ Voice-first interaction powered by AssemblyAI
- 🇬🇧 English personal transaction voice capture
- 🇻🇳 Vietnamese personal transaction voice capture
- 🧾 Receipt-to-transaction extraction
- ⌨️ Manual transaction entry
- 📊 Personal spending analytics
- 🗣️ Voice-based business investigation
- ⌨️ Text-based business investigation
- 📈 Revenue root-cause analysis
- 🏪 Seller contribution analysis
- 🔎 Transaction anomaly investigation
- 📄 Evidence-backed Insight Briefs
- 🛒 Real Olist e-commerce data

---

## 🌐 Live Demo

### [Open InsightVoice →](https://insightvoice-ai.netlify.app)

The frontend is deployed on **Netlify**, while the application and analytics APIs are hosted separately on **Render**.

> The backend services may require a short cold start after a period of inactivity.

---

## 🎬 Hackathon

Built for the **AssemblyAI Voice Agent Hackathon — September 2026**.

The core hackathon experience demonstrates:

```text
Speak a business question
        ↓
AssemblyAI transcription
        ↓
Business investigation
        ↓
Real data
        ↓
Evidence-backed Insight Brief
```

---

## 👩‍💻 Creator

**Nina Ng**

GitHub: https://github.com/nina-ng-labs

---

## 📄 License

This project is licensed under the MIT License.
