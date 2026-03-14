export const SYSTEM_PROMPT = `You are an enterprise AI readiness consultant. Analyze the company description provided and return ONLY valid JSON with no markdown, no code fences, and no extra text. The JSON must match this exact structure:
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

export const EXAMPLES = [
  "The client is a 5,000-person regional bank operating across eight US states with retail, commercial, and wealth lines of business. Core transaction processing still runs on COBOL mainframes, customer data is spread across fourteen data marts, and each division has its own analytics backlog and KPIs. The fraud and AML teams use rules-based tooling with limited real-time scoring, while branch operations still rely on manual document review for many KYC workflows. There are no dedicated ML engineers, only a 12-person BI team focused on reporting, and model governance currently sits entirely inside risk and compliance with long approval cycles. The CEO and business-unit leaders are pushing for AI-enabled service and underwriting improvements, but infrastructure and security leadership are cautious due to legacy debt, strict regulatory scrutiny, and prior failed modernization programs.",
  "The client is a 200-person healthcare SaaS company providing care coordination software to mid-sized provider networks, with operations in the US and Canada. Their stack is modern AWS (EKS, Snowflake, dbt, and event-driven services), and the data engineering group is strong, but data definitions vary by product team and patient identity resolution is still brittle across integrations. Product leadership wants to launch clinical documentation copilots and automated prior-authorization support, while customer success wants predictive churn and outcomes risk models. The company has HIPAA and SOC 2 controls in place, but PHI handling practices differ between engineering teams, redaction coverage is incomplete in logs, and there is no formal model risk management framework. Legal and compliance teams support AI adoption in principle, yet deployment velocity is slowed by uncertainty around explainability expectations, audit readiness, and incident response ownership for AI-assisted workflows.",
  "The client is a global telecom operator with 80,000 employees, presence in 27 countries, and a mix of consumer, enterprise, and network infrastructure services. The organization has multiple data platforms (legacy Hadoop, regional cloud warehouses, and domain-specific marts), but metadata standards are inconsistent and data quality ownership is unclear across markets. Isolated AI pilots exist in call-center summarization, network fault triage, and field-service routing, yet most pilots remain local and do not transition into enterprise products. There is no central AI operating model, no single executive accountable for cross-functional AI delivery, and procurement cycles for tooling are fragmented by region. Engineering talent is strong in a few digital hubs, but many markets rely on external vendors with limited knowledge transfer. Leadership sees clear value in AI for customer experience and network reliability, but program governance, reusable MLOps patterns, and enterprise change management are still immature.",
  "The client is a 12,000-person automotive manufacturer operating nine plants across North America and Europe with a mixed portfolio of combustion and EV programs. Plant operations run on heterogeneous MES and SCADA systems, ERP is SAP-based but heavily customized, and supplier performance data is not consistently reconciled with production and quality data. One plant has shown promising predictive maintenance results, yet the approach has not scaled because OT telemetry schemas differ by site and OT/IT integration responsibilities are unclear. Engineering teams want AI support for defect detection, demand-shaping, and supplier risk forecasting, while plant leadership is focused on uptime and safety constraints. Cybersecurity reviews for OT-connected AI workloads are lengthy, and unionized workforce concerns around automation create adoption sensitivity on the floor. Executive sponsorship exists, but the organization lacks a coordinated data governance model, standardized MLOps platform, and enterprise capability-building plan for frontline and operations managers.",
  "The client is a national grocery retailer with 1,100 stores, a growing e-commerce business, and private-label manufacturing partnerships across multiple categories. Point-of-sale, loyalty, promotion, and supply-chain data are available at scale, but demand forecasting logic still varies by region and pricing changes are often approved manually by category managers. Merchandising and digital teams use dashboards extensively, yet insights are not consistently operationalized into replenishment, markdown, or assortment decisions. The organization has piloted AI for personalized offers and out-of-stock prediction, but model performance drops when local events, weather shifts, or supplier disruptions occur because feature pipelines are not standardized. Data science capability is concentrated in headquarters with limited regional adoption support, and store operations teams report low trust in centrally produced recommendations. Leadership wants to improve margin, inventory turns, and customer retention through AI, but needs stronger governance, better integration with planning systems, and clearer accountability for value realization across merchandising, supply chain, and store execution.",
];

export const COMPARE_EXAMPLE_PRESETS = [
  { label: "Example 1 vs Example 2", a: 0, b: 1 },
  { label: "Example 1 vs Example 3", a: 0, b: 2 },
  { label: "Example 2 vs Example 4", a: 1, b: 3 },
  { label: "Example 3 vs Example 5", a: 2, b: 4 },
];

export const LOADING_STEPS = ["Parsing company profile", "Scoring AI readiness", "Identifying blockers", "Building roadmap"];

export const GAUGE_CONFETTI_PARTICLES = [
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

export const CATEGORY_LABELS = {
  dataMaturity: "Data Maturity",
  talentSkills: "Talent & Skills",
  infrastructure: "Infrastructure",
  orgCulture: "Org Culture",
};

export const CATEGORY_PLAYBOOK = {
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

export const INDUSTRY_KEYWORDS = [
  ["bank", "banking", "financial", "fintech", "insurance", "wealth", "credit union", "lending"],
  ["healthcare", "hospital", "clinical", "hipaa", "pharma", "payer", "provider"],
  ["retail", "ecommerce", "e-commerce", "store", "consumer", "merchandising"],
  ["telecom", "telco", "carrier", "network operations", "subscriber"],
  ["manufacturing", "factory", "plant", "industrial", "supply chain", "operations technology"],
  ["saas", "software", "tech", "platform", "developer tools", "cloud-native"],
];

export const INDUSTRY_BENCHMARKS = [
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
