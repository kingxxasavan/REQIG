// Optional Claude-powered advisor (Vercel serverless function).
//
// GET  /api/advisor  → { configured } so the UI knows whether to use it.
// POST /api/advisor  → { answer } for { question, summary, history }.
//
// The browser only ever sends aggregated figures (monthly totals, ratios,
// counts) — see advisorSummary() in src/lib/analytics.js. No names,
// salaries, customers or supplier details leave the device.

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You are EPRI, a friendly financial advisor for small, local businesses.
You are given a JSON summary of one business's last 12 months: revenue and spending by category (production, operations, payroll, marketing, other), industry benchmark ranges, budget pace, a 3-month forecast, a 0-100 health score and quality costs (damaged stock, returns, complaints).

How to answer:
- Plain English for a business owner with no accounting background. No jargon; if a term is unavoidable, explain it in a few words.
- Ground every claim in the numbers provided and quote the relevant figures. Never invent data that isn't in the summary; if the answer needs data you don't have, say what's missing.
- Be concrete: end with one to three specific next steps.
- Keep it under 180 words. Short paragraphs or a brief list. No headings.
- You are not a licensed accountant or tax advisor; for tax, legal or financing decisions suggest confirming with a professional.`;

const MAX_QUESTION = 500;
const MAX_SUMMARY_BYTES = 20_000;

export default async function handler(req, res) {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  if (req.method === "GET") return res.status(200).json({ configured });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!configured) return res.status(503).json({ error: "Advisor not configured" });

  const { question, summary, history, page } = req.body || {};
  const where = typeof page === "string" && page.length <= 60 ? page : null;
  if (typeof question !== "string" || !question.trim() || question.length > MAX_QUESTION) {
    return res.status(400).json({ error: "Invalid question" });
  }
  const summaryJson = JSON.stringify(summary ?? null);
  if (!summary || summaryJson.length > MAX_SUMMARY_BYTES) return res.status(400).json({ error: "Invalid summary" });

  const prior = (Array.isArray(history) ? history : [])
    .slice(-6)
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }));
  // The API expects alternating turns starting with the user.
  while (prior.length && prior[0].role !== "user") prior.shift();

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        ...prior,
        { role: "user", content: `Business summary (JSON):\n${summaryJson}\n\n${where ? `The owner is looking at the "${where}" page, so "this" or "here" refers to it.\n\n` : ""}Question: ${question.trim()}` },
      ],
    });
    if (response.stop_reason === "refusal") {
      return res.status(200).json({ answer: "I can't help with that one — try asking about your revenue, spending, budgets or forecast." });
    }
    const answer = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return res.status(200).json({ answer });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Busy — try again in a moment" });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: "Advisor unavailable" });
    return res.status(500).json({ error: "Advisor failed" });
  }
}
