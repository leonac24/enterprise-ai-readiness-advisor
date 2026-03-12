import { useState, useEffect, useRef } from "react";
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
  if (score >= 70) return "#86bc25";
  if (score >= 40) return "#e67e22";
  return "#c0392b";
}

function maturityLabel(score) {
  if (score >= 80) return "AI-Native";
  if (score >= 60) return "Emerging";
  if (score >= 40) return "Developing";
  if (score >= 20) return "Foundational";
  return "Nascent";
}

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function ScoreGauge({ score }) {
  const animated = useCountUp(score);
  const data = [{ value: animated, fill: scoreColor(score) }];
  return (
    <div className="gauge-wrap">
      <div className="gauge-container">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="58%"
            innerRadius="68%"
            outerRadius="90%"
            startAngle={180}
            endAngle={-180}
            data={data}
            barSize={16}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "#eef0f3" }} dataKey="value" angleAxisId={0} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="gauge-center">
          <span className="gauge-score" style={{ color: scoreColor(score) }}>{animated}</span>
          <span className="gauge-label">out of 100</span>
        </div>
      </div>
      <div className="maturity-badge" style={{ background: scoreColor(score) + "18", color: scoreColor(score) }}>
        {maturityLabel(score)}
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
            <div className="bar-fill" style={{ width: `${value}%`, background: scoreColor(value) }} />
          </div>
          <span className="bar-value" style={{ color: scoreColor(value) }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function Blockers({ blockers }) {
  return (
    <div className="blockers-grid">
      {blockers.map((b, i) => (
        <div key={i} className="blocker-card" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="blocker-index">{String(i + 1).padStart(2, "0")}</div>
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
        <div key={i} className="roadmap-item" style={{ animationDelay: `${i * 80}ms` }}>
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
  const steps = ["Parsing company profile", "Scoring AI readiness", "Identifying blockers", "Building roadmap"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="loading-container">
      <div className="loading-orb">
        <div className="loading-ring" />
        <div className="loading-ring loading-ring-2" />
      </div>
      <div className="loading-text">Analyzing AI Readiness</div>
      <div className="loading-step">{steps[step]}<span className="loading-dots">...</span></div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

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
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-dot" />
            <span className="header-title">AI Readiness Advisor</span>
          </div>
          <span className="header-badge">Enterprise</span>
        </div>
      </header>

      <div className="hero">
        <div className="hero-inner">
          <div className="hero-tag">Powered by Gemini 2.5 Flash</div>
          <h2 className="hero-heading">How AI-ready is your client?</h2>
          <p className="hero-sub">Get a scored assessment, critical blockers, and a transformation roadmap in seconds.</p>
        </div>
      </div>

      <div className="page">
        <section className="input-section">
          <div className="input-card">
            <label className="input-label">
              Client Profile
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
              <div className="examples-inline">
                <span className="examples-label">Try an example:</span>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} className="example-chip" onClick={() => setInput(ex)}>
                    Example {i + 1}
                  </button>
                ))}
              </div>
              <button className="submit-btn" onClick={analyze} disabled={loading || !input.trim()}>
                {loading ? "Analyzing…" : "Run Assessment →"}
              </button>
            </div>
          </div>
        </section>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {result && !loading && (
          <section className="results-section" ref={resultsRef}>
            <div className="verdict-bar">
              <div className="verdict-inner">
                <div className="verdict-label">Executive Assessment</div>
                <div className="verdict-text">{result.verdict}</div>
              </div>
            </div>

            <div className="score-row">
              <div className="score-panel">
                <div className="panel-label">Overall Readiness Score</div>
                <ScoreGauge score={result.overallScore} />
              </div>
              <div className="categories-panel">
                <div className="panel-label">Capability Breakdown</div>
                <CategoryBars categories={result.categories} />
              </div>
            </div>

            <div className="section-block animate-in">
              <div className="section-header">
                <span className="section-title">Critical Blockers</span>
                <span className="section-count">{result.blockers.length} identified</span>
              </div>
              <Blockers blockers={result.blockers} />
            </div>

            <div className="section-block animate-in" style={{ animationDelay: "100ms" }}>
              <div className="section-header">
                <span className="section-title">Transformation Roadmap</span>
                <span className="section-count">{result.roadmap.length} phases</span>
              </div>
              <Roadmap roadmap={result.roadmap} />
            </div>

            <div className="risk-banner animate-in" style={{ animationDelay: "200ms" }}>
              <div className="risk-icon">⚠</div>
              <div className="risk-content">
                <div className="risk-label">Risk Assessment</div>
                <div className="risk-text">{result.riskSummary}</div>
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="footer">
        AI-generated analysis · Not financial or legal advice · Powered by Gemini 2.5 Flash
      </footer>
    </div>
  );
}
