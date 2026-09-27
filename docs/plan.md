# 📄 [Product Name] — Product Requirements Document

| Field | Detail |
|---|---|
| **Status** | 🟡 Draft / 🟢 In Review / ✅ Approved / 🚀 Shipped / 🗄️ Archived |
| **Author** | [PM Name] |
| **Last Updated** | [YYYY-MM-DD] |
| **Document Owner** | [PM Name] |
| **Stakeholders** | Eng Lead, Design Lead, QA Lead, Data, GTM/Marketing, Legal |
| **Target Release** | [Quarter / Version / Date] |
| **Epic / Ticket** | [JIRA-XXX link] |
| **Design Link** | [Figma link] |
| **Eng Spec Link** | [Tech design doc link] |

> **TL;DR** *(2–3 sentences max)*: What are we building, for whom, and why now? A reader should understand the gist without scrolling further.

---

## 1. Overview & Context

### 1.1 Problem Statement
*What user or business problem are we solving? Be specific and evidence-backed. Avoid jumping to solutions.*

### 1.2 Background & Strategic Fit
*Why does this matter now? How does it ladder up to company/team OKRs or strategy? What's the cost of not doing it?*

### 1.3 Evidence & Insights
*Link the data, user research, support tickets, sales feedback, or competitive analysis that motivated this. Quantify where possible.*

---

## 2. Goals & Success Metrics

### 2.1 Goals
*The outcomes we want — not features. Phrase as objectives.*

### 2.2 Non-Goals
*Explicitly what's out of scope. This is one of the most valuable sections — it prevents scope creep.*

### 2.3 Success Metrics

| Metric | Type | Baseline | Target | How Measured |
|---|---|---|---|---|
| [e.g., Activation rate] | North Star / Primary | X% | Y% | [Dashboard/event] |
| [e.g., Task completion time] | Secondary | — | — | — |
| [e.g., Error rate] | Guardrail / Counter | — | — | — |

*Include **guardrail metrics** — things that must NOT regress (latency, churn, support volume).*

---

## 3. Users & Use Cases

### 3.1 Target Users / Personas
*Who is this for? Primary and secondary segments.*

### 3.2 User Stories
*Format: As a [persona], I want to [action], so that [benefit].*

- As a **[persona]**, I want to **[action]**, so that **[outcome]**.

### 3.3 Key Use Cases / Scenarios
*Narrative walkthroughs of the primary flows, including edge cases worth calling out early.*

---

## 4. Requirements

### 4.1 Functional Requirements
*Prioritized using MoSCoW (Must / Should / Could / Won't) or P0/P1/P2.*

| ID | Requirement | Priority | User Story Ref | Notes |
|---|---|---|---|---|
| FR-1 | [The system shall…] | P0 / Must | US-1 | |
| FR-2 | | P1 / Should | | |

### 4.2 Non-Functional Requirements
*Performance, scalability, availability, accessibility (WCAG), security, privacy, localization, compliance.*

| Category | Requirement |
|---|---|
| Performance | [e.g., p95 latency < 200ms] |
| Accessibility | [e.g., WCAG 2.1 AA] |
| Security/Privacy | [e.g., PII handling, GDPR] |
| Scale | [e.g., supports 10k concurrent users] |

### 4.3 User Experience & Design
*Link Figma. Embed key flows/wireframes. Note design principles, empty/error/loading states, and responsive behavior.*

---

## 5. Scope & Phasing

### 5.1 MVP / V1 Scope
*The smallest shippable slice that delivers value and lets us learn.*

### 5.2 Future Phases / Fast-Follows
*What's deferred and why.*

### 5.3 Dependencies
*Upstream/downstream teams, APIs, third-party services, platform requirements.*

| Dependency | Owner | Status | Risk if Delayed |
|---|---|---|---|

---

## 6. Solution Detail

### 6.1 Proposed Solution
*Conceptual description of how it works. Keep implementation-agnostic where possible; link the eng design doc for the how.*

### 6.2 Technical Considerations
*Known constraints, architecture notes, data model changes, instrumentation/tracking plan. Owned jointly with Eng.*

### 6.3 Analytics & Instrumentation
*What events must be logged to measure success? Define them up front so they ship with the feature, not after.*

---

## 7. Risks, Assumptions & Open Questions

### 7.1 Assumptions
*What we're treating as true. If any prove false, the plan changes.*

### 7.2 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|

### 7.3 Open Questions

| # | Question | Owner | Due | Status |
|---|---|---|---|---|

---

## 8. Go-to-Market & Rollout

### 8.1 Rollout Plan
*Feature flag strategy, % rollout, beta/dogfood, kill switch, regions.*

### 8.2 GTM & Comms
*Launch tier, marketing, sales enablement, docs, support training, pricing/packaging impact.*

### 8.3 Operational Readiness
*Monitoring, alerting, runbooks, on-call, support/CS readiness.*

---

## 9. Launch Checklist

- [ ] Design final & reviewed
- [ ] Eng spec approved
- [ ] QA test plan complete
- [ ] Analytics events verified firing
- [ ] Accessibility review passed
- [ ] Legal / Privacy / Security sign-off
- [ ] Support docs & training ready
- [ ] Feature flag & rollback plan in place
- [ ] Success metrics dashboard live

---

## 10. Appendix

### 10.1 Glossary
*Define domain terms, acronyms, and internal jargon so any reader is on the same page.*

### 10.2 References & Links
*Research docs, related PRDs, design files, eng specs, competitive teardowns, dashboards.*

### 10.3 Decision Log
*Record key decisions, the date, who made them, and the rationale — so future readers understand the "why."*

| Date | Decision | Rationale | Decided By |
|---|---|---|---|

### 10.4 Change Log
*Track meaningful revisions to this document.*

| Date | Author | Change |
|---|---|---|
