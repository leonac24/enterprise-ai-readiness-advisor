import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS } from "../config/constants";
import { maturityLabel, signedDelta } from "../core/utils";

// Injects optional benchmark context so advisor answers can reference peer baselines.
export function benchmarkPromptContext(benchmark) {
  return benchmark
    ? `Industry benchmark context:
- Selected benchmark: ${benchmark.label}
- Industry average overall score: ${benchmark.overallScore}
- Top quartile target score: ${benchmark.topQuartileScore}
- Category averages: Data Maturity ${benchmark.categories.dataMaturity}, Talent & Skills ${benchmark.categories.talentSkills}, Infrastructure ${benchmark.categories.infrastructure}, Org Culture ${benchmark.categories.orgCulture}`
    : "No industry benchmark was selected for this assessment.";
}

export function AdvisorQASection({ qaSystemPrompt, emptyText, animationDelay = "300ms" }) {
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
      // Replays the visible conversation so each response has full context.
      const contents = newMessages.map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.text }],
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
      setMessages((previous) => [...previous, { role: "advisor", text: replyText }]);
    } catch (error) {
      setMessages((previous) => [...previous, { role: "advisor", text: `Error: ${error.message}` }]);
    } finally {
      setThinking(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendMessage();
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`qa-bubble-row ${message.role === "user" ? "qa-bubble-row--user" : "qa-bubble-row--advisor"}`}
          >
            {message.role === "advisor" && <div className="qa-avatar">AI</div>}
            <div className={`qa-bubble ${message.role === "user" ? "qa-bubble--user" : "qa-bubble--advisor"}`}>
              {message.text}
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
          onChange={(event) => setInputText(event.target.value)}
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

// Single-assessment wrapper that builds a focused advisor prompt.
export function FollowUpQA({ result, profile, benchmark }) {
  const qaSystemPrompt = `You are a senior enterprise AI readiness consultant. You have just completed an assessment of the following client profile:

Profile: ${profile}

Assessment results:
- Overall Score: ${result.overallScore}/100 (${maturityLabel(result.overallScore)})
- Data Maturity: ${result.categories.dataMaturity}, Talent & Skills: ${result.categories.talentSkills}, Infrastructure: ${result.categories.infrastructure}, Org Culture: ${result.categories.orgCulture}
- Verdict: ${result.verdict}
- Key Blockers: ${result.blockers.map((blocker) => blocker.title).join(", ")}
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

// Compare-mode wrapper with explicit A/B deltas for advisor follow-ups.
export function CompareFollowUpQA({ resultA, resultB, profileA, profileB, benchmark }) {
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
- Profile A blockers: ${resultA.blockers.map((blocker) => blocker.title).join(", ")}
- Profile B blockers: ${resultB.blockers.map((blocker) => blocker.title).join(", ")}
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
