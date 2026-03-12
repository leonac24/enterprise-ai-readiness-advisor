# Enterprise AI Readiness Advisor

Enterprise AI Readiness Advisor is a React web app that helps consulting teams quickly evaluate how prepared an organization is for AI adoption. You provide a company profile, and the app generates a structured assessment with scores, blockers, risk commentary, and an actionable roadmap.

## What This Project Is

This project is an interactive assessment dashboard designed for advisory workflows.

- Audience: strategy, transformation, and AI consulting teams
- Purpose: convert unstructured client context into a repeatable readiness assessment
- Output style: executive-ready summaries with capability scoring and prioritized actions

## What It Does

The app provides two assessment modes:

1. Single Assessment
- Analyze one organization profile
- Return an overall AI readiness score (0-100)
- Score key capability categories: Data Maturity, Talent and Skills, Infrastructure, Org Culture
- Surface critical blockers and risk summary
- Generate a phased transformation roadmap

2. Compare Two Profiles
- Analyze two organizations side by side
- Compare scores, maturity labels, blockers, and risk narratives
- Support benchmark-based comparison for both profiles

Additional capabilities:

- Industry benchmarking with suggested industry detection from profile text
- Peer percentile and top-quartile target gap insights
- Follow-up Q and A chat against the generated assessment
- Print-to-PDF output for report sharing
- Animated score and roadmap visualizations for executive presentation

## Tech Stack

- Frontend framework: React 19
- Build tool and dev server: Vite 8
- Charting and data visualization: Recharts
- Language and styling: JavaScript (ES modules), CSS
- Linting: ESLint 9
- AI model integration: Gemini 2.5 Flash via Google Generative Language API

## How It Works (High Level)

1. User enters a client profile in plain language.
2. The app sends the profile plus a strict system prompt to Gemini.
3. Gemini returns structured JSON (score, categories, blockers, roadmap, risk, verdict).
4. The UI renders results as charts, cards, and timeline views.
5. Optional follow-up questions are answered in context of the generated assessment.

## Local Setup Tutorial

Follow these steps to run the project on your own machine.

### 1. Prerequisites

Install the following tools:

- Node.js 20+ (LTS recommended)
- npm 10+ (comes with recent Node.js)
- Git

Verify installation:

```bash
node -v
npm -v
git --version
```

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd enterprise-ai-readiness-advisor
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

This app expects a Gemini API key in a Vite environment variable.

Start from the provided template:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder value:

```bash
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

Notes:

- The variable name must be exactly `VITE_GEMINI_API_KEY`.
- You can generate a key from Google AI Studio / Gemini API tooling.
- `.env` is ignored by git so your real key is not committed.

### 5. Start the Development Server

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it in your browser.

### 6. Run an Assessment

1. Paste or type a sample client profile.
2. Click Run Assessment (or use Compare Two Profiles mode).
3. Optionally choose an industry benchmark.
4. Export a report with Download PDF when results are visible.

### 7. Build for Production

```bash
npm run build
```

This creates an optimized production bundle in `dist/`.

To preview the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint across the project

## Project Structure

```text
src/
	App.jsx       Main assessment workflow and UI logic
	App.css       Core styling, responsive layout, print styles
	main.jsx      React app bootstrap
	index.css     Global base styles
```

## Important Security Note

This version calls Gemini directly from the browser using a client-side environment variable. For internal demos this can be acceptable, but for production you should route model calls through a secure backend proxy so API credentials are not exposed to end users.

## Disclaimer

The generated outputs are decision-support guidance only and should not be treated as legal, financial, or regulatory advice.
