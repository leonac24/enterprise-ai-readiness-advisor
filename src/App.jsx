import { useMemo, useRef, useState } from "react";
import "./App.css";
import {
  COMPARE_EXAMPLE_PRESETS,
  EXAMPLES,
  INDUSTRY_BENCHMARKS,
} from "./features/config/constants";
import { callGemini } from "./features/core/api";
import { inferBenchmarkIndex } from "./features/core/utils";
import { LoadingSpinner } from "./features/components/AssessmentComponents";
import { CompareFollowUpQA, FollowUpQA } from "./features/components/QAComponents";
import {
  CompareResultColumn,
  CompareScoreBanner,
  SingleResultPanel,
} from "./features/components/ResultPanels";

// Composition root: owns page-level state and stitches feature modules together.
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

  // Resolve selected benchmark and infer likely industry from free-text profiles.
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

  // Mode switch keeps inputs but clears stale result artifacts.
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
      // Single-profile assessment pipeline.
      const parsed = await callGemini(input);
      setResult(parsed);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
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
      // Compare mode runs both assessments in parallel for a faster turnaround.
      const [parsedA, parsedB] = await Promise.all([callGemini(inputA), callGemini(inputB)]);
      setResultA(parsedA);
      setResultB(parsedB);
      setTimeout(() => compareResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setCompareError(err.message || "An unexpected error occurred.");
    } finally {
      setCompareLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) analyze();
  }

  function handleCompareKeyDown(event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) runComparison();
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
        {/* Controls */}
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

        <div className="benchmark-row">
          <label className="benchmark-label">Compare against industry benchmark:</label>
          <select
            className="benchmark-select"
            value={benchmarkIndex}
            onChange={(event) => setBenchmarkIndex(event.target.value)}
          >
            <option value="">- Select industry -</option>
            {INDUSTRY_BENCHMARKS.map((item, index) => (
              <option key={item.label} value={index}>
                {item.label} (avg {item.overallScore}, top quartile {item.topQuartileScore})
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

        {mode === "single" && (
          <>
          {/* Input + action block for one organization. */}
          <section className="input-section">
            <div className="input-card">
              <label className="input-label">
                Client Profile
                <span className="input-hint"> - Describe the organization</span>
              </label>
              <textarea
                className="input-area"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the client's size, industry, tech stack, data maturity, team capabilities, and organizational stance on AI adoption..."
                rows={5}
              />
              <div className="input-footer">
                <div className="examples-inline">
                  <span className="examples-label">Try an example:</span>
                  {EXAMPLES.map((example, index) => (
                    <button key={index} className="example-chip" onClick={() => setInput(example)}>
                      Example {index + 1}
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
                    {loading ? "Analyzing..." : "Run Assessment"}
                  </button>
                </div>
              </div>
            </div>
          </section>
          </>
        )}

        {mode === "compare" && (
          <>
          {/* Side-by-side intake for two organizations. */}
          <section className="compare-inputs-section">
            <div className="compare-inputs-grid">
              <div className="input-card">
                <label className="input-label">
                  Profile A
                  <span className="input-hint"> - First organization</span>
                </label>
                <textarea
                  className="input-area"
                  value={inputA}
                  onChange={(event) => setInputA(event.target.value)}
                  onKeyDown={handleCompareKeyDown}
                  placeholder="Describe the first client organization..."
                  rows={5}
                />
              </div>
              <div className="input-card">
                <label className="input-label">
                  Profile B
                  <span className="input-hint"> - Second organization</span>
                </label>
                <textarea
                  className="input-area"
                  value={inputB}
                  onChange={(event) => setInputB(event.target.value)}
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
                  {compareLoading ? "Analyzing..." : "Run Comparison"}
                </button>
              </div>
            </div>
          </section>
          </>
        )}

        {mode === "single" && loading && <LoadingSpinner />}
        {mode === "single" && error && (
          <div className="error-banner">
            <span className="error-icon">&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        {mode === "compare" && compareLoading && <LoadingSpinner />}
        {mode === "compare" && compareError && (
          <div className="error-banner">
            <span className="error-icon">&#9888;</span>
            <span>{compareError}</span>
          </div>
        )}

        {mode === "single" && result && !loading && (
          <>
          {/* Single assessment report with follow-up advisor chat. */}
          <section className="results-section" ref={resultsRef}>
            <SingleResultPanel result={result} benchmark={benchmark} />
            <FollowUpQA result={result} profile={input} benchmark={benchmark} />
          </section>
          </>
        )}

        {mode === "compare" && resultA && resultB && !compareLoading && (
          <>
          {/* Comparative report with per-profile detail columns and Q&A. */}
          <section className="results-section compare-results-section" ref={compareResultsRef}>
            <CompareScoreBanner resultA={resultA} resultB={resultB} benchmark={benchmark} />

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
          </>
        )}
      </div>

      <footer className="footer">
        AI-generated analysis &middot; Not financial or legal advice &middot; Powered by Gemini 2.5 Flash
      </footer>
    </div>
  );
}
