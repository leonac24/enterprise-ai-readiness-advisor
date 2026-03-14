import {
  Blockers,
  CategoryBars,
  IndustryDeltaPanel,
  Roadmap,
  ScoreGauge,
} from "./AssessmentComponents";
import {
  benchmarkDeltaTone,
  maturityLabel,
  scoreColor,
  signedDelta,
} from "../core/utils";

export function SingleResultPanel({ result, benchmark }) {
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

export function CompareResultColumn({ result, label, benchmark, columnIndex = 0 }) {
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

export function CompareScoreBanner({ resultA, resultB, benchmark }) {
  return (
    <div className="compare-score-banner animate-in">
      <div className="compare-score-item">
        <div className="compare-score-profile">Profile A</div>
        <div className="compare-score-value" style={{ color: scoreColor(resultA.overallScore) }}>
          {resultA.overallScore}
        </div>
        <div className="compare-score-maturity" style={{ color: scoreColor(resultA.overallScore) }}>
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
        <div className="compare-score-value" style={{ color: scoreColor(resultB.overallScore) }}>
          {resultB.overallScore}
        </div>
        <div className="compare-score-maturity" style={{ color: scoreColor(resultB.overallScore) }}>
          {maturityLabel(resultB.overallScore)}
        </div>
        {benchmark && (
          <div className={`compare-score-delta compare-score-delta--${benchmarkDeltaTone(resultB.overallScore - benchmark.overallScore)}`}>
            {signedDelta(resultB.overallScore - benchmark.overallScore)} vs {benchmark.label} avg
          </div>
        )}
      </div>
    </div>
  );
}
