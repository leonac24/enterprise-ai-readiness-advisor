import { useState, useEffect, useRef, useMemo } from "react";
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
  "The client is a 12,000-person automotive manufacturer operating across 9 plants. OT and IT systems are fragmented, predictive maintenance pilots exist in one region, and procurement data quality limits enterprise-scale optimization.",
  "The client is a national grocery retailer with 1,100 stores and a growing e-commerce channel. Merchandising teams use dashboards, but demand forecasting is inconsistent and pricing decisions are still mostly manual by region.",
];

const COMPARE_EXAMPLE_PRESETS = [
  { label: "Example 1 vs Example 2", a: 0, b: 1 },
  { label: "Example 1 vs Example 3", a: 0, b: 2 },
  { label: "Example 2 vs Example 4", a: 1, b: 3 },
  { label: "Example 3 vs Example 5", a: 2, b: 4 },
];

const LOADING_STEPS = ["Parsing company profile", "Scoring AI readiness", "Identifying blockers", "Building roadmap"];

const GAUGE_CONFETTI_PARTICLES = [
  { x: 16, y: 26, dx: -36, dy: -30, spin: -70, delay: 0, duration: 880, hue: "#86bc25" },
  { x: 24, y: 18, dx: -24, dy: -44, spin: 60, delay: 60, duration: 960, hue: "#1b5e8f" },
  { x: 34, y: 14, dx: -10, dy: -52, spin: -40, delay: 130, duration: 900, hue: "#f39c12" },
  { x: 44, y: 12, dx: -4, dy: -60, spin: 90, delay: 180, duration: 980, hue: "#86bc25" },
  { x: 56, y: 12, dx: 5, dy: -58, spin: -95, delay: 210, duration: 900, hue: "#1b5e8f" },
  { x: 66, y: 14, dx: 14, dy: -50, spin: 42, delay: 250, duration: 940, hue: "#f39c12" },
  { x: 76, y: 19, dx: 26, dy: -43, spin: -56, delay: 320, duration: 960, hue: "#86bc25" },
  { x: 84, y: 27, dx: 36, dy: -30, spin: 64, delay: 380, duration: 980, hue: "#1b5e8f" },
  { x: 14, y: 38, dx: -34, dy: -18, spin: -82, delay: 420, duration: 930, hue: "#f39c12" },
  { x: 86, y: 39, dx: 34, dy: -18, spin: 78, delay: 470, duration: 970, hue: "#86bc25" },
  { x: 18, y: 52, dx: -22, dy: -10, spin: -48, delay: 520, duration: 920, hue: "#1b5e8f" },
  { x: 82, y: 52, dx: 21, dy: -10, spin: 53, delay: 560, duration: 960, hue: "#f39c12" },
];

const CATEGORY_LABELS = {
  dataMaturity: "Data Maturity",
  talentSkills: "Talent & Skills",
  infrastructure: "Infrastructure",
  orgCulture: "Org Culture",
};

const CATEGORY_PLAYBOOK = {
  dataMaturity: {
    ifBehind:
      "Prioritize canonical definitions, quality SLAs, and governed data access so AI teams can trust shared data products.",
    ifAhead:
      "Use strong data foundations to standardize feature stores, model telemetry, and measurable business impact tracking.",
  },
  talentSkills: {
    ifBehind:
      "Close capability gaps with targeted upskilling, a small central AI platform squad, and role-specific enablement plans.",
    ifAhead:
      "Convert talent depth into delivery velocity by creating reusable playbooks and mentorship loops across product teams.",
  },
  infrastructure: {
    ifBehind:
      "Modernize deployment patterns with secure MLOps pipelines, policy controls, and scalable inference environments.",
    ifAhead:
      "Leverage infrastructure strength to pilot high-value use cases quickly while enforcing cost and reliability guardrails.",
  },
  orgCulture: {
    ifBehind:
      "Set clear executive sponsorship, decision rights, and adoption incentives to reduce cross-functional resistance.",
    ifAhead:
      "Scale cultural momentum with transparent success metrics and operating cadences that sustain AI adoption.",
  },
};

const INDUSTRY_KEYWORDS = [
  ["bank", "banking", "financial", "fintech", "insurance", "wealth", "credit union", "lending"],
  ["healthcare", "hospital", "clinical", "hipaa", "pharma", "payer", "provider"],
  ["retail", "ecommerce", "e-commerce", "store", "consumer", "merchandising"],
  ["telecom", "telco", "carrier", "network operations", "subscriber"],
  ["manufacturing", "factory", "plant", "industrial", "supply chain", "operations technology"],
  ["saas", "software", "tech", "platform", "developer tools", "cloud-native"],
];

const INDUSTRY_BENCHMARKS = [
  {
    label: "Banking",
    overallScore: 58,
    topQuartileScore: 74,
    summary:
      "Peers in regulated financial services usually progress with strong controls but face slower change velocity and legacy integration constraints.",
    categories: { dataMaturity: 62, talentSkills: 50, infrastructure: 60, orgCulture: 55 },
  },
  {
    label: "Healthcare",
    overallScore: 52,
    topQuartileScore: 69,
    summary:
      "Healthcare peers often show moderate data readiness and infrastructure, with governance and compliance burden as major adoption friction.",
    categories: { dataMaturity: 55, talentSkills: 48, infrastructure: 54, orgCulture: 50 },
  },
  {
    label: "Retail",
    overallScore: 61,
    topQuartileScore: 77,
    summary:
      "Retail peers typically outperform on data-driven decisioning but vary significantly in enterprise-wide operating model maturity.",
    categories: { dataMaturity: 65, talentSkills: 55, infrastructure: 63, orgCulture: 60 },
  },
  {
    label: "Telecom",
    overallScore: 64,
    topQuartileScore: 80,
    summary:
      "Telecom peers generally benefit from scale and infrastructure depth but can be slowed by fragmented ownership and legacy estates.",
    categories: { dataMaturity: 68, talentSkills: 60, infrastructure: 70, orgCulture: 58 },
  },
  {
    label: "Manufacturing",
    overallScore: 47,
    topQuartileScore: 63,
    summary:
      "Manufacturing peers often have uneven digital foundations, with strong operations expertise but slower enterprise data modernization.",
    categories: { dataMaturity: 45, talentSkills: 42, infrastructure: 50, orgCulture: 44 },
  },
  {
    label: "Tech/SaaS",
    overallScore: 78,
    topQuartileScore: 90,
    summary:
      "Tech peers usually lead on productized AI and platform maturity, making talent differentiation and governance discipline key battlegrounds.",
    categories: { dataMaturity: 80, talentSkills: 78, infrastructure: 82, orgCulture: 75 },
  },
];

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function signedDelta(delta) {
  return `${delta > 0 ? "+" : ""}${delta}`;
}

function percentileSuffix(value) {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function benchmarkDeltaTone(delta) {
  if (delta >= 8) return "ahead";
  if (delta >= 2) return "slightly-ahead";
  if (delta <= -8) return "behind";
  if (delta <= -2) return "slightly-behind";
  return "at-parity";
}

function benchmarkDeltaLabel(delta) {
  const tone = benchmarkDeltaTone(delta);
  if (tone === "ahead") return "Ahead of peers";
  if (tone === "slightly-ahead") return "Slightly ahead";
  if (tone === "behind") return "Behind peers";
  if (tone === "slightly-behind") return "Slightly behind";
  return "At peer parity";
}

function inferBenchmarkIndex(text) {
  const source = text.trim().toLowerCase();
  if (!source) return null;

  let bestIndex = null;
  let bestScore = 0;

  INDUSTRY_KEYWORDS.forEach((keywords, index) => {
    const score = keywords.reduce((total, keyword) => {
      if (!source.includes(keyword)) return total;
      return total + (keyword.includes(" ") ? 2 : 1);
    }, 0);

    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestIndex : null;
}

function buildIndustryInsights(result, benchmark) {
  const categoryDeltas = Object.entries(result.categories || {})
    .map(([key, score]) => {
      const benchmarkScore = benchmark.categories[key] ?? 0;
      const delta = score - benchmarkScore;
      return {
        key,
        label: CATEGORY_LABELS[key] || key,
        score,
        benchmarkScore,
        delta,
        tone: benchmarkDeltaTone(delta),
      };
    })
    .sort((a, b) => a.delta - b.delta);

  const overallDelta = result.overallScore - benchmark.overallScore;
  const percentile = clamp(Math.round(50 + overallDelta * 2.2), 5, 95);
  const topQuartileScore = benchmark.topQuartileScore ?? clamp(benchmark.overallScore + 14, 0, 100);
  const pointsToTopQuartile = Math.max(0, topQuartileScore - result.overallScore);

  const gaps = categoryDeltas.filter(item => item.delta < 0);
  const strengths = categoryDeltas.filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta);

  const priorityActions = [];
  const biggestGap = gaps[0];
  const secondGap = gaps[1];
  const strongestCapability = strengths[0];

  if (biggestGap) {
    priorityActions.push({
      title: `Close ${biggestGap.label} gap (${signedDelta(biggestGap.delta)} pts)`,
      detail:
        CATEGORY_PLAYBOOK[biggestGap.key]?.ifBehind ||
        "Address the largest capability gap through a time-bound program with clear ownership and measurable outcomes.",
    });
  }

  if (secondGap) {
    priorityActions.push({
      title: `Stabilize ${secondGap.label} (${signedDelta(secondGap.delta)} pts)`,
      detail:
        CATEGORY_PLAYBOOK[secondGap.key]?.ifBehind ||
        "Run a targeted remediation plan on this second-order gap to prevent bottlenecks during AI scaling.",
    });
  }

  if (strongestCapability) {
    priorityActions.push({
      title: `Leverage ${strongestCapability.label} strength (${signedDelta(strongestCapability.delta)} pts)`,
      detail:
        CATEGORY_PLAYBOOK[strongestCapability.key]?.ifAhead ||
        "Use the strongest capability as a force multiplier to accelerate near-term use-case delivery.",
    });
  }

  if (priorityActions.length < 3) {
    priorityActions.push({
      title: "Institute quarterly benchmark reviews",
      detail:
        "Track score movement against the selected peer baseline each quarter to verify that roadmap actions are closing structural gaps.",
    });
  }

  return {
    overallDelta,
    percentile,
    topQuartileScore,
    pointsToTopQuartile,
    categoryDeltas,
    priorityActions,
  };
}

function useInViewOnce(threshold = 0.18, rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, threshold, rootMargin]);

  return [ref, isVisible];
}

function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let timer;

    const kickoff = setTimeout(() => {
      setCount(0);
      if (target === 0) return;

      let start = 0;
      const step = 16;
      const increment = target / (duration / step);

      timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, step);
    }, delay);

    return () => {
      clearTimeout(kickoff);
      if (timer) clearInterval(timer);
    };
  }, [target, duration, delay]);
  return count;
}

async function callGemini(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
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
  return JSON.parse(raw);
}

function ScoreGauge({ score, benchmarkScore }) {
  const animated = useCountUp(score);
  const isSettled = score > 0 && animated >= score;
  const showConfetti = score >= 80 && isSettled;
  const data = [{ value: animated, fill: scoreColor(score) }];

  return (
    <div className="gauge-wrap">
      <div className="gauge-container">
        <div className={`gauge-burst${isSettled ? " gauge-burst--active" : ""}`} />
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
        {showConfetti && (
          <div className="gauge-confetti" aria-hidden="true">
            {GAUGE_CONFETTI_PARTICLES.map((particle, index) => (
              <span
                key={`${particle.x}-${particle.y}-${index}`}
                className="gauge-confetti-piece"
                style={{
                  "--piece-x": `${particle.x}%`,
                  "--piece-y": `${particle.y}%`,
                  "--piece-dx": `${particle.dx}px`,
                  "--piece-dy": `${particle.dy}px`,
                  "--piece-spin": `${particle.spin}deg`,
                  "--piece-delay": `${particle.delay}ms`,
                  "--piece-duration": `${particle.duration}ms`,
                  "--piece-color": particle.hue,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="maturity-badge" style={{ background: scoreColor(score) + "18", color: scoreColor(score) }}>
        {maturityLabel(score)}
      </div>
      {benchmarkScore != null && (
        <div className="gauge-benchmark">
          Industry avg: <strong>{benchmarkScore}</strong>
        </div>
      )}
    </div>
  );
}

function AnimatedCategoryBar({ categoryKey, value, benchmarkValue, index, startDelay = 0 }) {
  const rowDelay = startDelay + index * 120;
  const animatedValue = useCountUp(value, 950, rowDelay);

  return (
    <div className="bar-row" style={{ "--bar-row-delay": `${rowDelay}ms` }}>
      <span className="bar-label">{CATEGORY_LABELS[categoryKey]}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${animatedValue}%`, background: scoreColor(animatedValue) }} />
        {benchmarkValue != null && (
          <div
            className="bar-benchmark-marker"
            style={{ left: `${benchmarkValue}%` }}
            title={`Industry avg: ${benchmarkValue}`}
          />
        )}
      </div>
      <span className="bar-value" style={{ color: scoreColor(animatedValue) }}>{animatedValue}</span>
    </div>
  );
}

function CategoryBars({ categories, benchmark, startDelay = 0 }) {
  return (
    <div className="category-bars">
      {Object.entries(categories).map(([key, value], index) => {
        const bv = benchmark ? benchmark.categories[key] : null;
        return (
          <AnimatedCategoryBar
            key={key}
            categoryKey={key}
            value={value}
            benchmarkValue={bv}
            index={index}
            startDelay={startDelay}
          />
        );
      })}
      {benchmark && (
        <div className="benchmark-note">
          Industry avg: <strong>{benchmark.overallScore}</strong> — {benchmark.label}
        </div>
      )}
    </div>
  );
}

function IndustryDeltaPanel({ result, benchmark, compact = false }) {
  const [panelRef, panelVisible] = useInViewOnce(0.2, "0px 0px -8% 0px");
  if (!benchmark) return null;

  const insights = buildIndustryInsights(result, benchmark);
  const actions = compact ? insights.priorityActions.slice(0, 2) : insights.priorityActions;
  const overallTone = benchmarkDeltaTone(insights.overallDelta);
  const kpis = [
    { label: "Selected benchmark", value: benchmark.label },
    {
      label: "Estimated peer percentile",
      value: `${insights.percentile}${percentileSuffix(insights.percentile)}`,
    },
    {
      label: "Top quartile target",
      value:
        insights.pointsToTopQuartile === 0
          ? "Already top quartile"
          : `${insights.pointsToTopQuartile} pts to ${insights.topQuartileScore}`,
    },
  ];

  return (
    <div
      ref={panelRef}
      className={`section-block industry-delta-panel${compact ? " industry-delta-panel--compact" : ""}${panelVisible ? " industry-delta-panel--visible" : ""}`}
    >
      <div className="section-header industry-animate-item" style={{ "--industry-delay": "40ms" }}>
        <span className="section-title">Industry Positioning</span>
        <span className={`industry-overall-chip industry-overall-chip--${overallTone} industry-animate-item`} style={{ "--industry-delay": "90ms" }}>
          {benchmarkDeltaLabel(insights.overallDelta)} ({signedDelta(insights.overallDelta)})
        </span>
      </div>

      <div className="industry-kpi-grid">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="industry-kpi-card industry-animate-item"
            style={{ "--industry-delay": `${160 + index * 90}ms` }}
          >
            <div className="industry-kpi-label">{kpi.label}</div>
            <div className="industry-kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="industry-delta-list">
        {insights.categoryDeltas.map((item, index) => (
          <div
            key={item.key}
            className="industry-delta-row industry-animate-item"
            style={{ "--industry-delay": `${420 + index * 80}ms` }}
          >
            <div className="industry-delta-name">{item.label}</div>
            <div className="industry-delta-scores">
              {item.score} vs {item.benchmarkScore}
            </div>
            <div className={`industry-delta-pill industry-delta-pill--${item.tone}`}>{signedDelta(item.delta)}</div>
          </div>
        ))}
      </div>

      <div className={`industry-actions-grid${compact ? " industry-actions-grid--compact" : ""}`}>
        {actions.map((action, i) => (
          <div
            key={`${action.title}-${i}`}
            className="industry-action-card industry-animate-item"
            style={{ "--industry-delay": `${760 + i * 110}ms` }}
          >
            <div className="industry-action-step">Priority {i + 1}</div>
            <div className="industry-action-title">{action.title}</div>
            <div className="industry-action-detail">{action.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Blockers({ blockers }) {
  const [blockersRef, blockersVisible] = useInViewOnce(0.22, "0px 0px -8% 0px");

  return (
    <div ref={blockersRef} className={`blockers-grid${blockersVisible ? " blockers-grid--visible" : ""}`}>
      {blockers.map((b, i) => (
        <div key={i} className="blocker-card" style={{ "--blocker-delay": `${i * 120}ms` }}>
          <div className="blocker-index">{String(i + 1).padStart(2, "0")}</div>
          <div className="blocker-title">{b.title}</div>
          <div className="blocker-detail">{b.detail}</div>
        </div>
      ))}
    </div>
  );
}

function Roadmap({ roadmap }) {
  const [roadmapRef, roadmapVisible] = useInViewOnce(0.25, "0px 0px -12% 0px");

  return (
    <div ref={roadmapRef} className={`roadmap${roadmapVisible ? " roadmap--visible" : ""}`}>
      {roadmap.map((item, i) => (
        <div key={i} className="roadmap-item" style={{ "--roadmap-delay": `${i * 160}ms` }}>
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
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="loading-container">
      <div className="loading-orb">
        <div className="loading-ring" />
        <div className="loading-ring loading-ring-2" />
      </div>
      <div className="loading-text">Analyzing AI Readiness</div>
      <div className="loading-step">{LOADING_STEPS[step]}<span className="loading-dots">...</span></div>
    </div>
  );
}

function benchmarkPromptContext(benchmark) {
  return benchmark
    ? `Industry benchmark context:
- Selected benchmark: ${benchmark.label}
- Industry average overall score: ${benchmark.overallScore}
- Top quartile target score: ${benchmark.topQuartileScore}
- Category averages: Data Maturity ${benchmark.categories.dataMaturity}, Talent & Skills ${benchmark.categories.talentSkills}, Infrastructure ${benchmark.categories.infrastructure}, Org Culture ${benchmark.categories.orgCulture}`
    : "No industry benchmark was selected for this assessment.";
}

function AdvisorQASection({ qaSystemPrompt, emptyText, animationDelay = "300ms" }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || thinking) return;
    setInputText("");
    const userMsg = { role: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);

    try {
      const contents = newMessages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: qaSystemPrompt }] },
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }
      const data = await response.json();
      const replyText = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { role: "advisor", text: replyText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "advisor", text: `Error: ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage();
  }

  return (
    <div className="section-block animate-in qa-section" style={{ animationDelay }}>
      <div className="section-header">
        <span className="section-title">Follow-up Q&amp;A</span>
        <span className="section-count">Ask the advisor</span>
      </div>

      <div className="qa-messages">
        {messages.length === 0 && !thinking && (
          <div className="qa-empty">{emptyText}</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`qa-bubble-row ${m.role === "user" ? "qa-bubble-row--user" : "qa-bubble-row--advisor"}`}
          >
            {m.role === "advisor" && <div className="qa-avatar">AI</div>}
            <div className={`qa-bubble ${m.role === "user" ? "qa-bubble--user" : "qa-bubble--advisor"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="qa-bubble-row qa-bubble-row--advisor">
            <div className="qa-avatar">AI</div>
            <div className="qa-bubble qa-bubble--advisor qa-thinking">
              Thinking
              <span className="qa-thinking-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="qa-input-row">
        <input
          className="qa-input"
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question... (Cmd+Enter to send)"
          disabled={thinking}
        />
        <button
          className="qa-send-btn"
          onClick={sendMessage}
          disabled={thinking || !inputText.trim()}
        >
          Ask &rarr;
        </button>
      </div>
    </div>
  );
}

function FollowUpQA({ result, profile, benchmark }) {
  const qaSystemPrompt = `You are a senior enterprise AI readiness consultant. You have just completed an assessment of the following client profile:

Profile: ${profile}

Assessment results:
- Overall Score: ${result.overallScore}/100 (${maturityLabel(result.overallScore)})
- Data Maturity: ${result.categories.dataMaturity}, Talent & Skills: ${result.categories.talentSkills}, Infrastructure: ${result.categories.infrastructure}, Org Culture: ${result.categories.orgCulture}
- Verdict: ${result.verdict}
- Key Blockers: ${result.blockers.map(b => b.title).join(", ")}
- Risk Summary: ${result.riskSummary}

${benchmarkPromptContext(benchmark)}

Answer follow-up questions from the consultant team concisely and analytically. Maintain the tone of a senior advisor. Respond in plain text (no markdown, no bullet points with asterisks — use plain prose or numbered lists only).`;

  return (
    <AdvisorQASection
      qaSystemPrompt={qaSystemPrompt}
      emptyText="Ask a follow-up question about this assessment — e.g. &quot;What should the client prioritize first?&quot; or &quot;How does their data maturity compare to peers?&quot;"
      animationDelay="300ms"
    />
  );
}

function CompareFollowUpQA({ resultA, resultB, profileA, profileB, benchmark }) {
  const categoryComparison = Object.keys(CATEGORY_LABELS)
    .map((key) => {
      const delta = resultA.categories[key] - resultB.categories[key];
      return `${CATEGORY_LABELS[key]}: A ${resultA.categories[key]} vs B ${resultB.categories[key]} (${signedDelta(delta)})`;
    })
    .join(", ");

  const qaSystemPrompt = `You are a senior enterprise AI readiness consultant. You have completed a comparative assessment for two organizations.

Profile A:
${profileA}

Profile B:
${profileB}

Comparison results:
- Profile A overall score: ${resultA.overallScore}/100 (${maturityLabel(resultA.overallScore)})
- Profile B overall score: ${resultB.overallScore}/100 (${maturityLabel(resultB.overallScore)})
- Overall delta (A-B): ${signedDelta(resultA.overallScore - resultB.overallScore)}
- Category comparison: ${categoryComparison}
- Profile A verdict: ${resultA.verdict}
- Profile B verdict: ${resultB.verdict}
- Profile A blockers: ${resultA.blockers.map(b => b.title).join(", ")}
- Profile B blockers: ${resultB.blockers.map(b => b.title).join(", ")}
- Profile A risk summary: ${resultA.riskSummary}
- Profile B risk summary: ${resultB.riskSummary}

${benchmarkPromptContext(benchmark)}

Answer comparative follow-up questions with clear recommendations for each profile and explicit tradeoffs. Maintain the tone of a senior advisor. Respond in plain text (no markdown, no bullet points with asterisks — use plain prose or numbered lists only).`;

  return (
    <AdvisorQASection
      qaSystemPrompt={qaSystemPrompt}
      emptyText="Ask a comparison follow-up — e.g. &quot;Which profile can reach top quartile faster?&quot; or &quot;What should Profile B copy from Profile A first?&quot;"
      animationDelay="260ms"
    />
  );
}

function SingleResultPanel({ result, benchmark }) {
  return (
    <>
      <div className="verdict-bar">
        <div className="verdict-inner">
          <div className="verdict-label">Executive Assessment</div>
          <div className="verdict-text">{result.verdict}</div>
        </div>
      </div>

      <div className="score-row">
        <div className="score-panel">
          <div className="panel-label">Overall Readiness Score</div>
          <ScoreGauge score={result.overallScore} benchmarkScore={benchmark ? benchmark.overallScore : null} />
        </div>
        <div className="categories-panel">
          <div className="panel-label">Capability Breakdown</div>
          <CategoryBars categories={result.categories} benchmark={benchmark} />
        </div>
      </div>

      <IndustryDeltaPanel result={result} benchmark={benchmark} />

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
        <div className="risk-icon">&#9888;</div>
        <div className="risk-content">
          <div className="risk-label">Risk Assessment</div>
          <div className="risk-text">{result.riskSummary}</div>
        </div>
      </div>
    </>
  );
}

function CompareResultColumn({ result, label, benchmark, columnIndex = 0 }) {
  const columnDelay = columnIndex * 80;

  return (
    <div className="compare-col">
      <div className="compare-col-label animate-in" style={{ animationDelay: `${columnDelay}ms` }}>{label}</div>

      <div className="verdict-bar" style={{ animationDelay: `${columnDelay}ms` }}>
        <div className="verdict-inner">
          <div className="verdict-label">Executive Assessment</div>
          <div className="verdict-text">{result.verdict}</div>
        </div>
      </div>

      <div className="score-panel compare-score-panel animate-in" style={{ animationDelay: `${columnDelay + 80}ms` }}>
        <div className="panel-label">Overall Readiness Score</div>
        <ScoreGauge score={result.overallScore} benchmarkScore={benchmark ? benchmark.overallScore : null} />
      </div>

      <div className="categories-panel compare-categories-panel animate-in" style={{ animationDelay: `${columnDelay + 120}ms` }}>
        <div className="panel-label">Capability Breakdown</div>
        <CategoryBars categories={result.categories} benchmark={benchmark} startDelay={columnDelay + 220} />
      </div>

      <IndustryDeltaPanel result={result} benchmark={benchmark} compact />

      <div className="section-block animate-in compare-blockers-block" style={{ animationDelay: `${columnDelay + 200}ms` }}>
        <div className="section-header">
          <span className="section-title">Critical Blockers</span>
          <span className="section-count">{result.blockers.length} identified</span>
        </div>
        <Blockers blockers={result.blockers} />
      </div>

      <div className="section-block animate-in compare-roadmap-block" style={{ animationDelay: `${columnDelay + 240}ms` }}>
        <div className="section-header">
          <span className="section-title">Transformation Roadmap</span>
          <span className="section-count">{result.roadmap.length} phases</span>
        </div>
        <Roadmap roadmap={result.roadmap} />
      </div>

      <div className="risk-banner animate-in compare-risk-banner" style={{ animationDelay: `${columnDelay + 320}ms` }}>
        <div className="risk-icon">&#9888;</div>
        <div className="risk-content">
          <div className="risk-label">Risk Assessment</div>
          <div className="risk-text">{result.riskSummary}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("single");

  // Single mode state
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  // Compare mode state
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const compareResultsRef = useRef(null);

  // Benchmark state
  const [benchmarkIndex, setBenchmarkIndex] = useState("");

  const benchmark = benchmarkIndex !== "" ? INDUSTRY_BENCHMARKS[Number(benchmarkIndex)] : null;

  const inferredSingleIndustry = useMemo(() => inferBenchmarkIndex(input), [input]);
  const inferredIndustryA = useMemo(() => inferBenchmarkIndex(inputA), [inputA]);
  const inferredIndustryB = useMemo(() => inferBenchmarkIndex(inputB), [inputB]);

  const suggestedBenchmarkIndex = useMemo(() => {
    if (benchmarkIndex !== "") return null;
    if (mode === "single") return inferredSingleIndustry;
    if (inferredIndustryA != null && inferredIndustryB != null) {
      return inferredIndustryA === inferredIndustryB ? inferredIndustryA : null;
    }
    return inferredIndustryA ?? inferredIndustryB ?? null;
  }, [benchmarkIndex, mode, inferredSingleIndustry, inferredIndustryA, inferredIndustryB]);

  const compareIndustryMismatch =
    mode === "compare" &&
    inferredIndustryA != null &&
    inferredIndustryB != null &&
    inferredIndustryA !== inferredIndustryB;

  function switchMode(newMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setResult(null);
    setResultA(null);
    setResultB(null);
    setError(null);
    setCompareError(null);
  }

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await callGemini(input);
      setResult(parsed);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function runComparison() {
    if (!inputA.trim() || !inputB.trim()) return;
    setCompareLoading(true);
    setCompareError(null);
    setResultA(null);
    setResultB(null);
    try {
      const [parsedA, parsedB] = await Promise.all([callGemini(inputA), callGemini(inputB)]);
      setResultA(parsedA);
      setResultB(parsedB);
      setTimeout(() => compareResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setCompareError(e.message || "An unexpected error occurred.");
    } finally {
      setCompareLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
  }

  function handleCompareKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runComparison();
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
          <h2 className="hero-heading">How AI-ready is your client?</h2>
          <p className="hero-sub">Get a scored assessment, critical blockers, and a transformation roadmap in seconds.</p>
        </div>
      </div>

      <div className="page">
        {/* Mode Toggle */}
        <div className="mode-toggle-row">
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === "single" ? " mode-btn--active" : ""}`}
              onClick={() => switchMode("single")}
            >
              Single Assessment
            </button>
            <button
              className={`mode-btn${mode === "compare" ? " mode-btn--active" : ""}`}
              onClick={() => switchMode("compare")}
            >
              Compare Two Profiles
            </button>
          </div>
        </div>

        {/* Benchmark Selector */}
        <div className="benchmark-row">
          <label className="benchmark-label">Compare against industry benchmark:</label>
          <select
            className="benchmark-select"
            value={benchmarkIndex}
            onChange={e => setBenchmarkIndex(e.target.value)}
          >
            <option value="">— Select industry —</option>
            {INDUSTRY_BENCHMARKS.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label} (avg {b.overallScore}, top quartile {b.topQuartileScore})
              </option>
            ))}
          </select>
          {benchmark && (
            <button
              type="button"
              className="benchmark-clear-btn"
              onClick={() => setBenchmarkIndex("")}
            >
              Clear
            </button>
          )}
        </div>

        {benchmark && (
          <div className="benchmark-context">
            <div className="benchmark-context-title">{benchmark.label} peer baseline</div>
            <div className="benchmark-context-text">{benchmark.summary}</div>
            <div className="benchmark-context-metrics">
              <span>Industry avg: {benchmark.overallScore}</span>
              <span>Top quartile target: {benchmark.topQuartileScore}</span>
            </div>
          </div>
        )}

        {!benchmark && suggestedBenchmarkIndex != null && (
          <div className="benchmark-suggestion">
            <span>
              Suggested benchmark: <strong>{INDUSTRY_BENCHMARKS[suggestedBenchmarkIndex].label}</strong>
            </span>
            <button
              type="button"
              className="benchmark-apply-btn"
              onClick={() => setBenchmarkIndex(String(suggestedBenchmarkIndex))}
            >
              Apply Suggestion
            </button>
          </div>
        )}

        {compareIndustryMismatch && (
          <div className="benchmark-warning">
            Profiles appear to map to different industries ({INDUSTRY_BENCHMARKS[inferredIndustryA].label} vs {INDUSTRY_BENCHMARKS[inferredIndustryB].label}). A single benchmark can still be used, but peer deltas are more reliable when each profile is evaluated against its own industry.
          </div>
        )}

        {/* Single Mode Input */}
        {mode === "single" && (
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
                <div className="input-footer-right">
                  <button
                    className="pdf-btn"
                    onClick={() => window.print()}
                    disabled={!result}
                  >
                    Download PDF
                  </button>
                  <button
                    className="submit-btn"
                    onClick={analyze}
                    disabled={loading || !input.trim()}
                  >
                    {loading ? "Analyzing\u2026" : "Run Assessment \u2192"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Compare Mode Inputs */}
        {mode === "compare" && (
          <section className="compare-inputs-section">
            <div className="compare-inputs-grid">
              <div className="input-card">
                <label className="input-label">
                  Profile A
                  <span className="input-hint"> — First organization</span>
                </label>
                <textarea
                  className="input-area"
                  value={inputA}
                  onChange={e => setInputA(e.target.value)}
                  onKeyDown={handleCompareKeyDown}
                  placeholder="Describe the first client organization..."
                  rows={5}
                />
              </div>
              <div className="input-card">
                <label className="input-label">
                  Profile B
                  <span className="input-hint"> — Second organization</span>
                </label>
                <textarea
                  className="input-area"
                  value={inputB}
                  onChange={e => setInputB(e.target.value)}
                  onKeyDown={handleCompareKeyDown}
                  placeholder="Describe the second client organization..."
                  rows={5}
                />
              </div>
            </div>
            <div className="compare-footer">
              <div className="examples-inline">
                <span className="examples-label">Load examples:</span>
                {COMPARE_EXAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className="example-chip"
                    onClick={() => {
                      setInputA(EXAMPLES[preset.a]);
                      setInputB(EXAMPLES[preset.b]);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="input-footer-right">
                <button
                  className="pdf-btn"
                  onClick={() => window.print()}
                  disabled={!resultA || !resultB}
                >
                  Download PDF
                </button>
                <button
                  className="submit-btn"
                  onClick={runComparison}
                  disabled={compareLoading || !inputA.trim() || !inputB.trim()}
                >
                  {compareLoading ? "Analyzing\u2026" : "Run Comparison \u2192"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Single mode loading / error */}
        {mode === "single" && loading && <LoadingSpinner />}
        {mode === "single" && error && (
          <div className="error-banner">
            <span className="error-icon">&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        {/* Compare mode loading / error */}
        {mode === "compare" && compareLoading && <LoadingSpinner />}
        {mode === "compare" && compareError && (
          <div className="error-banner">
            <span className="error-icon">&#9888;</span>
            <span>{compareError}</span>
          </div>
        )}

        {/* Single Results */}
        {mode === "single" && result && !loading && (
          <section className="results-section" ref={resultsRef}>
            <SingleResultPanel result={result} benchmark={benchmark} />
            <FollowUpQA result={result} profile={input} benchmark={benchmark} />
          </section>
        )}

        {/* Compare Results */}
        {mode === "compare" && resultA && resultB && !compareLoading && (
          <section className="results-section compare-results-section" ref={compareResultsRef}>
            <div className="compare-score-banner animate-in">
              <div className="compare-score-item">
                <div className="compare-score-profile">Profile A</div>
                <div
                  className="compare-score-value"
                  style={{ color: scoreColor(resultA.overallScore) }}
                >
                  {resultA.overallScore}
                </div>
                <div
                  className="compare-score-maturity"
                  style={{ color: scoreColor(resultA.overallScore) }}
                >
                  {maturityLabel(resultA.overallScore)}
                </div>
                {benchmark && (
                  <div className={`compare-score-delta compare-score-delta--${benchmarkDeltaTone(resultA.overallScore - benchmark.overallScore)}`}>
                    {signedDelta(resultA.overallScore - benchmark.overallScore)} vs {benchmark.label} avg
                  </div>
                )}
              </div>
              <div className="compare-vs">VS</div>
              <div className="compare-score-item">
                <div className="compare-score-profile">Profile B</div>
                <div
                  className="compare-score-value"
                  style={{ color: scoreColor(resultB.overallScore) }}
                >
                  {resultB.overallScore}
                </div>
                <div
                  className="compare-score-maturity"
                  style={{ color: scoreColor(resultB.overallScore) }}
                >
                  {maturityLabel(resultB.overallScore)}
                </div>
                {benchmark && (
                  <div className={`compare-score-delta compare-score-delta--${benchmarkDeltaTone(resultB.overallScore - benchmark.overallScore)}`}>
                    {signedDelta(resultB.overallScore - benchmark.overallScore)} vs {benchmark.label} avg
                  </div>
                )}
              </div>
            </div>

            <div className="compare-columns">
              <CompareResultColumn result={resultA} label="Profile A" benchmark={benchmark} columnIndex={0} />
              <CompareResultColumn result={resultB} label="Profile B" benchmark={benchmark} columnIndex={1} />
            </div>

            <CompareFollowUpQA
              resultA={resultA}
              resultB={resultB}
              profileA={inputA}
              profileB={inputB}
              benchmark={benchmark}
            />
          </section>
        )}
      </div>

      <footer className="footer">
        AI-generated analysis &middot; Not financial or legal advice &middot; Powered by Gemini 2.5 Flash
      </footer>
    </div>
  );
}
