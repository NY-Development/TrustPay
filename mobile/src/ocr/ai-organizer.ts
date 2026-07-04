const EXPO_OPEN_ROUTER_API_KEY = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;

export const organizeReceiptData = async (rawOcrText: string) => {
  console.log("[TrustPay AI] Processing OCR...");
  console.log("[TrustPay AI] OCR Length:", rawOcrText.length);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EXPO_OPEN_ROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8081",
          "X-Title": "TrustPay Verification Mobile",
        },

        body: JSON.stringify({
          model: "openai/gpt-4o-mini",

          response_format: {
            type: "json_object",
          },

          messages: [
            {
              role: "system",
              content: `
You are TrustPay's Payment Receipt Extraction Engine.

Your ONLY job is to extract payment verification information from OCR text.

The OCR may come from:

• CBE
• Bank of Abyssinia
• Dashen
• Awash
• Siinqee
• Telebirr
• CBE Birr
• M-PESA
• Kaafi Ebirr

Never explain anything.

Never summarize.

Never return Markdown.

Never return code blocks.

Return ONLY ONE VALID JSON OBJECT.

----------------------------------------
DETECT THE BANK
----------------------------------------

Possible values

cbe
boa
telebirr
cbebirr
mpesa
dashen
awash
siinqee
kaafiebirr
unknown

----------------------------------------
EXTRACT
----------------------------------------

Transaction Number

Reference Number

Receipt Number

Receipt URL

Account Suffix

Phone Number

Amount

Currency

Date

Time

Sender Name

Receiver Name

Merchant

Payment Status

----------------------------------------
IMPORTANT
----------------------------------------

If multiple transaction IDs exist,

choose the official transaction reference used for payment verification.

Ignore invoice numbers.

Ignore tax invoice IDs.

Ignore MRC.

Ignore TIN.

Ignore serial numbers.

Ignore POS terminal IDs.

Ignore cashier IDs.

Ignore internal receipt counters.

Prioritize

Transaction Number

Reference Number

Receipt Number

depending on the payment provider.

----------------------------------------
NORMALIZATION
----------------------------------------

Phone

Accept

0911223344

Normalize to

251911223344

Account suffix

Extract only digits.

For CBE

Exactly 8 digits.

For BOA

Exactly 5 digits.

Numbers

Return numbers.

Not strings.

Unknown values

Use

null

----------------------------------------
RETURN EXACTLY
----------------------------------------

{
  "bank": "unknown",

  "transactionNumber": null,

  "referenceNumber": null,

  "receiptNumber": null,

  "receiptUrl": null,

  "accountSuffix": null,

  "phoneNumber": null,

  "amount": null,

  "currency": "ETB",

  "date": null,

  "time": null,

  "senderName": null,

  "receiverName": null,

  "merchant": null,

  "paymentStatus": null,

  "confidence": 0.0
}
              `,
            },

            {
              role: "user",
              content: `OCR TEXT

${rawOcrText}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        "[TrustPay AI]",
        response.status,
        errorBody
      );

      throw new Error(
        `OpenRouter Error ${response.status}: ${errorBody}`
      );
    }

    const json = await response.json();

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI.");
    }

    console.log("[TrustPay AI] Extraction Complete");

    const safeParse = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        const cleaned = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        return JSON.parse(cleaned);
      }
    };
    return safeParse(content);
  } catch (error) {
    console.error("[TrustPay AI]", error);
    throw error;
  }
};