import { useEffect, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  CATEGORY_LABELS,
  GAUGE_CONFETTI_PARTICLES,
  LOADING_STEPS,
} from "../config/constants";
import {
  benchmarkDeltaLabel,
  benchmarkDeltaTone,
  buildIndustryInsights,
  clamp,
  percentileSuffix,
  scoreColor,
  signedDelta,
  useCountUp,
  useInViewOnce,
  maturityLabel,
} from "../core/utils";

export function ScoreGauge({ score, benchmarkScore }) {
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
      <div className="maturity-badge" style={{ background: `${scoreColor(score)}18`, color: scoreColor(score) }}>
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

export function CategoryBars({ categories, benchmark, startDelay = 0 }) {
  return (
    <div className="category-bars">
      {Object.entries(categories).map(([key, value], index) => {
        const benchmarkValue = benchmark ? benchmark.categories[key] : null;
        return (
          <AnimatedCategoryBar
            key={key}
            categoryKey={key}
            value={value}
            benchmarkValue={benchmarkValue}
            index={index}
            startDelay={startDelay}
          />
        );
      })}
    </div>
  );
}

export function IndustryDeltaPanel({ result, benchmark, compact = false }) {
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

      {compact ? (
        <div className="industry-delta-list">
          {insights.categoryDeltas.map((item, index) => (
            <div
              key={item.key}
              className="industry-delta-row industry-animate-item"
              style={{ "--industry-delay": `${420 + index * 80}ms` }}
            >
              <div className="industry-delta-name">{item.label}</div>
              <div className={`industry-delta-pill industry-delta-pill--${item.tone}`}>{signedDelta(item.delta)}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="industry-compare-legend industry-animate-item" style={{ "--industry-delay": "380ms" }}>
            <div className="industry-compare-legend-item">
              <span className="industry-compare-legend-swatch industry-compare-legend-swatch--client" />
              Client score
            </div>
            <div className="industry-compare-legend-item">
              <span className="industry-compare-legend-swatch industry-compare-legend-swatch--industry" />
              Industry score
            </div>
          </div>

          <div className="industry-compare-list">
            {insights.categoryDeltas.map((item, index) => {
              const industryWidth = clamp(item.benchmarkScore, 0, 100);
              const clientWidth = clamp(item.score, 0, 100);

              return (
                <div
                  key={item.key}
                  className="industry-compare-row industry-animate-item"
                  style={{ "--industry-delay": `${430 + index * 90}ms` }}
                >
                  <div className="industry-delta-name industry-compare-name">{item.label}</div>

                  <div className="industry-compare-bars" title={`Client ${item.score} vs industry ${item.benchmarkScore}`}>
                    <div className="industry-compare-series">
                      <div className="industry-compare-track">
                        <div
                          className="industry-compare-bar industry-compare-bar--industry"
                          style={{ width: `${industryWidth}%` }}
                        />
                      </div>
                      <span className="industry-compare-score">{item.benchmarkScore}</span>
                    </div>

                    <div className="industry-compare-series">
                      <div className="industry-compare-track">
                        <div
                          className="industry-compare-bar industry-compare-bar--client"
                          style={{ width: `${clientWidth}%` }}
                        />
                      </div>
                      <span className="industry-compare-score">{item.score}</span>
                    </div>
                  </div>

                  <div className={`industry-delta-pill industry-delta-pill--${item.tone}`}>{signedDelta(item.delta)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

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

export function Blockers({ blockers }) {
  const [blockersRef, blockersVisible] = useInViewOnce(0.22, "0px 0px -8% 0px");

  return (
    <div ref={blockersRef} className={`blockers-grid${blockersVisible ? " blockers-grid--visible" : ""}`}>
      {blockers.map((blocker, index) => (
        <div key={index} className="blocker-card" style={{ "--blocker-delay": `${index * 120}ms` }}>
          <div className="blocker-index">{String(index + 1).padStart(2, "0")}</div>
          <div className="blocker-title">{blocker.title}</div>
          <div className="blocker-detail">{blocker.detail}</div>
        </div>
      ))}
    </div>
  );
}

export function Roadmap({ roadmap }) {
  const [roadmapRef, roadmapVisible] = useInViewOnce(0.25, "0px 0px -12% 0px");

  return (
    <div ref={roadmapRef} className={`roadmap${roadmapVisible ? " roadmap--visible" : ""}`}>
      {roadmap.map((item, index) => (
        <div key={index} className="roadmap-item" style={{ "--roadmap-delay": `${index * 160}ms` }}>
          <div className="roadmap-node">
            <div className="node-circle">{item.step}</div>
            {index < roadmap.length - 1 && <div className="node-line" />}
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

export function LoadingSpinner() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((value) => (value + 1) % LOADING_STEPS.length), 900);
    return () => clearInterval(timer);
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
