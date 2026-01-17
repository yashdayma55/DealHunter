// src/utils/isValidDeal.ts

/**
 * This validator is shared by Reddit + Telegram.
 * It is intentionally conservative: better to drop junk than show spam.
 */

const BLOCKED_FLAIRS = [
  "question",
  "request",
  "help",
  "discussion",
  "meta",
  "dev",
  "showcase",
  "tech support",
  "looking for",
  "misc",
];

const QUESTION_PREFIXES = [
  "is there",
  "can i",
  "can anyone",
  "does anyone",
  "any app",
  "what app",
  "what is",
  "how to",
  "how do",
  "looking for",
  "request",
  "help",
  "question",
  "support",
  "searching",
  "has anyone",
  "anyone know",
  "need",
  "do you",
  "which app",
];

const BAD_KEYWORDS = [
  "not working",
  "issue",
  "problem",
  "bug",
  "vs",
  "versus",
  "alternative to",
  "recommendation",
  "suggestion",
  "hacked",
  "virus",
  "malware",
  "safe?",
];

const DEAL_SIGNALS = [
  "free",
  "100%",
  "off",
  "discount",
  "sale",
  "deal",
  "$",
  "€",
  "£",
  "¥",
  "₹",
];

// Arabic + RTL unicode blocks
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function isValidDeal(
  title: string,
  body?: string | null,
  flair?: string
): boolean {
  if (!title) return false;

  const lowerTitle = title.toLowerCase().trim();
  const lowerFlair = (flair || "").toLowerCase();
  const lowerBody = (body || "").toLowerCase();

  // ─────────────────────────────────────────────
  // RULE 1: HARD LANGUAGE FILTER (Telegram spam)
  // ─────────────────────────────────────────────
  // Reject Arabic / RTL scripts immediately
  if (RTL_REGEX.test(title)) return false;

  // Must contain at least one English letter
  if (!/[a-z]/i.test(title)) return false;

  // ─────────────────────────────────────────────
  // RULE 2: Block by flair (Reddit only)
  // ─────────────────────────────────────────────
  if (BLOCKED_FLAIRS.some((f) => lowerFlair.includes(f))) return false;

  // ─────────────────────────────────────────────
  // RULE 3: Block obvious questions
  // ─────────────────────────────────────────────
  if (lowerTitle.endsWith("?")) return false;

  if (QUESTION_PREFIXES.some((q) => lowerTitle.startsWith(q))) return false;

  // ─────────────────────────────────────────────
  // RULE 4: Block bad / discussion keywords
  // ─────────────────────────────────────────────
  if (BAD_KEYWORDS.some((b) => lowerTitle.includes(b))) return false;

  // ─────────────────────────────────────────────
  // RULE 5: Anti-spam length guard
  // ─────────────────────────────────────────────
  // Very short titles are almost always junk
  if (lowerTitle.length < 6) return false;

  // ─────────────────────────────────────────────
  // RULE 6: Must contain a deal signal
  // ─────────────────────────────────────────────
  const hasDealSignal =
    DEAL_SIGNALS.some((s) => lowerTitle.includes(s)) ||
    DEAL_SIGNALS.some((s) => lowerBody.includes(s));

  if (!hasDealSignal) return false;

  // ─────────────────────────────────────────────
  // RULE 7: Prevent version-only false positives
  // ─────────────────────────────────────────────
  // Example: "AppName v2.3.1 released"
  const looksLikeVersionOnly =
    /v\d+(\.\d+)+/.test(lowerTitle) &&
    !DEAL_SIGNALS.some((s) => lowerTitle.includes(s));

  if (looksLikeVersionOnly) return false;

  return true;
}
