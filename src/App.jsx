import { useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const SYSTEM_PROMPT = `You are an enterprise AI readiness consultant. Analyze the company description provided and return ONLY valid JSON with no markdown, no code fences, and no extra text. The JSON must match this exact structure:
{
  "overallScore": <integer 0-100>,
  "categories": {
    "dataMaturity": <integer 0-100>,
    "talentSkills": <integer 0-100>,
    "infrastructure": <integer 0-100>,
    "orgCulture": <integer 0-100>
  },
  "blockers": [
    { "title": "<short title>", "detail": "<2-3 sentence explanation>" }
  ],
  "roadmap": [
    { "step": <integer>, "action": "<action title>", "timeframe": "<e.g. Month 1-3>" }
  ],
  "riskSummary": "<2-3 sentence paragraph summarizing key risks>",
  "verdict": "<1 sentence executive verdict on AI readiness>"
}
Write all output from the perspective of a senior consultant advising the organization — use "the client", "we recommend", "our assessment", "the organization should". Never use first-person from the client's perspective. Return between 3-5 blockers and 4-6 roadmap steps. Be specific, analytical, and enterprise-grade in your assessment.`;

const EXAMPLES = [
  "The client is a 5,000-person regional bank. Legacy mainframe systems, siloed data teams across 4 divisions, no ML engineers on staff. Leadership is enthusiastic about AI but IT leadership is resistant to change.",
  "The client is a 200-person healthcare SaaS startup on a modern AWS cloud stack with a strong data engineering team. Regulatory concerns around HIPAA compliance are the primary barrier slowing AI adoption.",
  "The client is a global telecom with 80,000 employees. Data lakes exist but quality is poor and ungoverned. A few isolated AI pilots have launched in customer service, but there is no central AI strategy or owner.",
];

const CATEGORY_LABELS = {
  dataMaturity: "Data Maturity",
  talentSkills: "Talent & Skills",
  infrastructure: "Infrastructure",
  orgCulture: "Org Culture",
};

function scoreColor(score) {
  if (score >= 70) return "#00ff87";
  if (score >= 40) return "#ffd60a";
  return "#ff4d4d";
}

function ScoreGauge({ score }) {
  const data = [{ value: score, fill: scoreColor(score) }];
  return (
    <div className="gauge-container">
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart
          cx="50%"
          cy="55%"
          innerRadius="65%"
          outerRadius="90%"
          startAngle={180}
          endAngle={-180}
          data={data}
          barSize={18}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#1c2333" }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={9}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="gauge-center">
        <span className="gauge-score" style={{ color: scoreColor(score) }}>
          {score}
        </span>
        <span className="gauge-label">/ 100</span>
      </div>
    </div>
  );
}

function CategoryBars({ categories }) {
  return (
    <div className="category-bars">
      {Object.entries(categories).map(([key, value]) => (
        <div key={key} className="bar-row">
          <span className="bar-label">{CATEGORY_LABELS[key]}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${value}%`,
                background: scoreColor(value),
              }}
            />
          </div>
          <span className="bar-value" style={{ color: scoreColor(value) }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Blockers({ blockers }) {
  return (
    <div className="blockers-grid">
      {blockers.map((b, i) => (
        <div key={i} className="blocker-card">
          <div className="blocker-title">{b.title}</div>
          <div className="blocker-detail">{b.detail}</div>
        </div>
      ))}
    </div>
  );
}

function Roadmap({ roadmap }) {
  return (
    <div className="roadmap">
      {roadmap.map((item, i) => (
        <div key={i} className="roadmap-item">
          <div className="roadmap-node">
            <div className="node-circle">{item.step}</div>
            {i < roadmap.length - 1 && <div className="node-line" />}
          </div>
          <div className="roadmap-content">
            <div className="roadmap-action">{item.action}</div>
            <div className="roadmap-timeframe">{item.timeframe}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loading-ring" />
      <div className="loading-text">Analyzing AI Readiness...</div>
      <div className="loading-sub">Processing enterprise data signals</div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(raw);
      setResult(parsed);
    } catch (e) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <h1 className="header-title">Enterprise AI Readiness Advisor</h1>
        </div>
      </header>

      {/* Input Section */}
      <section className="input-section">
        <div className="input-card">
          <label className="input-label">
            COMPANY PROFILE
            <span className="input-hint"> — Describe the organization</span>
          </label>
          <textarea
            className="input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the client's size, industry, tech stack, data maturity, team capabilities, and organizational stance on AI adoption..."
            rows={5}
          />
          <div className="input-footer">
            <span className="input-hint-cmd">⌘ + Enter to submit</span>
            <button
              className="submit-btn"
              onClick={analyze}
              disabled={loading || !input.trim()}
            >
              {loading ? "Analyzing..." : "Run Assessment →"}
            </button>
          </div>

          <div className="examples-section">
            <div className="examples-label">EXAMPLE PROFILES</div>
            <div className="examples-list">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setInput(ex)}
                >
                  <span className="example-num">0{i + 1}</span>
                  <span className="example-text">{ex}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <section className="results-section">
          {/* Verdict */}
          <div className="verdict-bar">
            <span className="verdict-label">EXECUTIVE VERDICT</span>
            <span className="verdict-text">{result.verdict}</span>
          </div>

          {/* Score + Categories */}
          <div className="score-row">
            <div className="score-panel">
              <div className="panel-label">OVERALL AI READINESS SCORE</div>
              <ScoreGauge score={result.overallScore} />
            </div>
            <div className="categories-panel">
              <div className="panel-label">CAPABILITY BREAKDOWN</div>
              <CategoryBars categories={result.categories} />
            </div>
          </div>

          {/* Blockers */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">CRITICAL BLOCKERS</span>
              <span className="section-count">{result.blockers.length} identified</span>
            </div>
            <Blockers blockers={result.blockers} />
          </div>

          {/* Roadmap */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">TRANSFORMATION ROADMAP</span>
              <span className="section-count">{result.roadmap.length} phases</span>
            </div>
            <Roadmap roadmap={result.roadmap} />
          </div>

          {/* Risk Banner */}
          <div className="risk-banner">
            <div className="risk-icon">⚠</div>
            <div className="risk-content">
              <div className="risk-label">RISK ASSESSMENT</div>
              <div className="risk-text">{result.riskSummary}</div>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>AI-generated analysis · Not financial or legal advice · Powered by Gemini 2.5 Flash</span>
      </footer>
    </div>
  );
}
