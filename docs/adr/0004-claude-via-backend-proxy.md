# ADR-0004: Call Claude only through our backend, only for flagged findings

- Status: Accepted
- Date: 2026-10-14

## Context
We want warnings that a normal user understands, in Bahasa Indonesia, tailored to the specific finding (which token, which spender, which brand is being imitated). Static copy covers the common cases; an LLM covers the long tail and wording quality.

Constraints:
- An API key must never ship inside an extension (anyone can unzip it).
- Warnings must appear instantly; an LLM call takes seconds.
- Browsing data must stay private (ADR-0005).

## Decision
- A Cloudflare Worker (`worker/`) holds `ANTHROPIC_API_KEY` as a secret and exposes `POST /explain`.
- The extension sends **only flagged findings**: kind, host, level/risk, reason codes, and decoded details (spender, token, amount). Never the full URL, page HTML, calldata blobs, or the user's address.
- The Worker calls Claude (`claude-opus-5-5`, effort `low`, server-side refusal fallback enabled) with structured output `{ explanation, action }`.
- The UI shows static copy immediately and appends the AI text if it arrives within 8 s. Any failure leaves the static copy alone.
- The Worker checks `Origin` equals the extension origin and caps the body at 4 KB. Before public launch it adds a rate limit plus a KV cache keyed by finding hash (identical findings, such as a popular phishing domain, are explained once).

## Consequences
- **+** No key exposure; the AI is additive and never blocks a warning.
- **+** Cost scales with warnings shown, not page views. The cache cuts repeated findings.
- **−** A backend to operate. Cloudflare Workers keep this small.
- **−** The model could word something wrongly. Mitigated: static copy is always shown first, the prompt forbids going beyond the data, and output is schema-constrained.
