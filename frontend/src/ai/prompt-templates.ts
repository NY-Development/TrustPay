/**
 * Centralized Prompt Templates
 *
 * Prompts instruct the model to return valid JSON only.
 * No markdown presentation code exists here.
 */

// ─── Receipt Extraction ──────────────────────────────────────────

export const RECEIPT_EXTRACTION_PROMPT = `You are a financial document parser. Extract structured data from the following receipt or payment confirmation text.

Extract the following fields:
- merchant: the business or service name
- date: payment date in ISO 8601 format (YYYY-MM-DD)
- subtotal: amount before tax
- tax: tax amount
- vat: VAT amount (if applicable, otherwise null)
- total: final total amount
- currency: 3-letter currency code (default "ETB")
- paymentMethod: cash, card, mobile, transfer, etc.
- items: array of { name, quantity, unitPrice, total }
- category: one of [meals, travel, lodging, groceries, transportation, utilities, entertainment, healthcare, education, shopping, business, rent_housing, subscriptions, personal_care, donations, taxes_fees, services, hardware, software, other]
- referenceNumber: transaction reference or receipt number
- transactionNumber: transaction ID if different from reference
- bank: payment provider or bank name (e.g. cbe, telebirr, boa, dashen, awash)
- senderName: payer name if present
- receiverName: payee/merchant name if present
- confidence: your confidence in the extraction accuracy (0.0 to 1.0)

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Receipt text:
`;

// ─── Insight Generation ──────────────────────────────────────────

export const INSIGHT_GENERATION_PROMPT = `You are a financial analyst AI. Analyze the following receipt data and generate spending insights.

Generate the following:
- spendingTrends: array of { category, amount, percentage, period, changePercent, direction } showing spending patterns
- recurringMerchants: array of { merchant, frequency, totalAmount, isRecurring, averageAmount } for frequently visited merchants
- budgetWarnings: array of { category, limit, currentSpending, severity, message } for categories with concerning spending
- monthlySummary: a 2-3 sentence summary of overall spending behavior
- recommendations: array of 3-5 actionable financial recommendations

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Receipt data:
`;

// ─── Audit Generation ────────────────────────────────────────────

export const AUDIT_GENERATION_PROMPT = `You are a financial auditor AI. Analyze the following receipt data for potential issues.

Generate the following:
- suspiciousTransactions: array of { referenceNumber, reason, severity, amount, merchant } for questionable transactions
- duplicateCount: number of likely duplicate transactions detected
- unusualExpenses: array of { description, amount, reason } for unusual spending patterns
- taxIssues: array of string descriptions of potential tax-related concerns
- missingReceipts: array of string descriptions noting gaps in receipt documentation
- overallConfidence: your confidence in the audit analysis (0.0 to 1.0)
- summary: a 2-3 sentence audit summary

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Receipt data:
`;

// ─── Expense Categorization ──────────────────────────────────────

export const CATEGORIZATION_PROMPT = `You are an expense categorizer. Classify the following transaction description into exactly one category.

Categories: meals, travel, lodging, groceries, transportation, utilities, entertainment, healthcare, education, shopping, business, rent_housing, subscriptions, personal_care, donations, taxes_fees, services, hardware, software, other

Return ONLY a JSON object with a single "category" field. No markdown, no explanation.
Example: {"category": "meals"}

Transaction:
`;

// ─── Document Summarization ──────────────────────────────────────

export const SUMMARIZATION_PROMPT = `You are a document summarizer. Provide a concise summary of the following document content.

Return ONLY a JSON object with a single "summary" field containing 2-4 sentences. No markdown, no explanation.
Example: {"summary": "The document describes..."}

Document:
`;

// ─── Anomaly Detection ───────────────────────────────────────────

export const ANOMALY_DETECTION_PROMPT = `You are a financial anomaly detection AI. Analyze the following transaction data for anomalies.

Generate the following:
- anomalies: array of { type, description, riskScore, referenceNumber, severity, relatedTransaction } where type is one of [amount_spike, unusual_merchant, duplicate, time_anomaly, category_mismatch]
- riskScore: overall risk score from 0 (safe) to 100 (high risk)
- summary: a 1-2 sentence summary of findings

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Transaction data:
`;
