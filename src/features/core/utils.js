import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS, CATEGORY_PLAYBOOK, INDUSTRY_KEYWORDS } from "../config/constants";

// Presentation helpers used by charts, badges, and compare labels.
export function scoreColor(score) {
  if (score >= 70) return "#86bc25";
  if (score >= 40) return "#e67e22";
  return "#c0392b";
}

export function maturityLabel(score) {
  if (score >= 80) return "AI-Native";
  if (score >= 60) return "Emerging";
  if (score >= 40) return "Developing";
  if (score >= 20) return "Foundational";
  return "Nascent";
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function signedDelta(delta) {
  return `${delta > 0 ? "+" : ""}${delta}`;
}

export function percentileSuffix(value) {
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

export function benchmarkDeltaTone(delta) {
  if (delta >= 8) return "ahead";
  if (delta >= 2) return "slightly-ahead";
  if (delta <= -8) return "behind";
  if (delta <= -2) return "slightly-behind";
  return "at-parity";
}

export function benchmarkDeltaLabel(delta) {
  const tone = benchmarkDeltaTone(delta);
  if (tone === "ahead") return "Ahead of peers";
  if (tone === "slightly-ahead") return "Slightly ahead";
  if (tone === "behind") return "Behind peers";
  if (tone === "slightly-behind") return "Slightly behind";
  return "At peer parity";
}

// Picks the best-matching benchmark index from free-text profile content.
export function inferBenchmarkIndex(text) {
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

// Computes roll-up insights used by the industry positioning panel.
export function buildIndustryInsights(result, benchmark) {
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

  const gaps = categoryDeltas.filter((item) => item.delta < 0);
  const strengths = categoryDeltas.filter((item) => item.delta > 0).sort((a, b) => b.delta - a.delta);

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

// One-time visibility hook to stagger entrance animations as sections scroll into view.
export function useInViewOnce(threshold = 0.18, rootMargin = "0px 0px -10% 0px") {
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

// Lightweight count-up animation for score and bar transitions.
export function useCountUp(target, duration = 1200, delay = 0) {
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
