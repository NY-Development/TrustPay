# **Architecture and Implementation of Ethiopian Payment Verification in MERN Stack Backends**

Automating payment reconciliation is a cornerstone of modern software-as-a-service platforms, e-commerce systems, and digital marketplaces. Within the Ethiopian fintech ecosystem, the integration of distinct payment networks—such as Telebirr, the Commercial Bank of Ethiopia, Bank of Abyssinia, and M-Pesa—presents a substantial challenge for software engineers.1 Each provider exposes highly disparate payload structures, communication protocols, and transaction validation states.1  
This report provides an architectural guide for integrating the open-source Verifier API and its corresponding Node.js/TypeScript SDK, @creofam/verifier, into a MERN stack backend.1 Developed to normalize transaction validation, this utility abstracts the idiosyncratic verification procedures of individual local providers into a single, predictable, and normalized schema, mitigating the risks of transaction spoofing and manual ledger reconciliation.1

## **Architectural Mechanics and Ecosystem Capabilities**

The @creofam/verifier SDK acts as a standardized abstraction layer over a proxy routing architecture.1 When integrated into foreign-hosted cloud environments, such as Amazon Web Services or Hetzner, direct queries to local banking networks can be restricted, latent, or blocked by firewalls.2 The underlying Verifier API addresses this through a hybrid proxy system that routes requests through localized Ethiopian edge nodes, maintaining high availability and low latency.2  
The payment ecosystem is highly dynamic, requiring tracking of provider-specific statuses and technical requirements.1 The table below outlines the active status, required parameters, and capabilities of each provider supported by the SDK:

| Provider Name | Identifier Code | Required API Parameters | Operational Status | Key Output Fields |
| :---- | :---- | :---- | :---- | :---- |
| **Telebirr** | telebirr | reference | Fully Functional 1 | totalAmount, payerPhone, receiverAccount, statusText, status, serviceFee, serviceFeeVAT 1 |
| **Commercial Bank of Ethiopia** | cbe | reference, accountSuffix | Fully Functional 1 | payerAccount, receiverAccount, reason, payerName 1 |
| **Bank of Abyssinia** | abyssinia | reference, suffix | Fully Functional 1 | payerAccount, reason, payerName, amount 1 |
| **M-Pesa** | mpesa | receiptNumber | Fully Functional 1 | payerAccount, receiverAccount, serviceFee, vat, transactionId 1 |
| **CBE Birr** | cbebirr | reference | Under Maintenance 1 | — |
| **Dashen Bank** | dashen | reference | Under Maintenance 1 | — |

The system requires Node.js version 18 or above and operates under the permissive MIT license.1 This allows enterprise backends to deploy the library without licensing complications.1

## **SDK Configuration and Client Initialization**

The SDK client defaults its communication channel to the official API base.1 It requires a valid API key obtained via the developer dashboard.1 The client object exposes configuration parameters to tune network behavior, request headers, and automatic backoff retry parameters.1

| Parameter Name | TypeScript Type | Purpose | Default Value |
| :---- | :---- | :---- | :---- |
| apiKey | string | The authorization token sent as the x-api-key header.1 | *Required* 1 |
| baseUrl | string | The API endpoint that acts as the router to Ethiopian bank nodes.1 | https://verifyapi.leulzenebe.pro 1 |
| timeoutMs | number | Request execution limit before throwing an AbortError.1 | undefined (No timeout) |
| userAgent | string | Custom user-agent header sent with outbound requests.1 | @creofam/verifier default |
| headers | Record\<string, string\> | Custom key-value pairs added to the outbound request headers.1 | {} |
| max429Retries | number | Maximum automated retry attempts when encountering rate limits.1 | undefined (No retries) |
| retryDelayMs | number | Milliseconds to delay before retrying a throttled request.1 | 1000 |

### **Singleton Initialization Pattern**

To avoid resource exhaustion and coordinate rate-limiting parameters across incoming API calls, the VerifierClient must be initialized as a singleton module within the Express application structure 1:

JavaScript  
// config/verifier.js  
const { VerifierClient } \= require('@creofam/verifier');  
require('dotenv').config();

if (\!process.env.VERIFIER\_API\_KEY) {  
  throw new Error("CRITICAL CONFIGURATION ERROR: VERIFIER\_API\_KEY is not defined in environment variables.");  
}

const verifierClient \= new VerifierClient({  
  apiKey: process.env.VERIFIER\_API\_KEY,  
  timeoutMs: 15000,   
  max429Retries: 3,   
  retryDelayMs: 1000   
});

module.exports \= verifierClient;

## **MongoDB Schema Design and Idempotency Control**

A major security risk in payment verification integrations is the replay attack, where a client submits a single valid transaction reference repeatedly to credit an account multiple times. To prevent this, the MongoDB schema must enforce strict uniqueness constraints and log the transaction lifecycle.

### **Mongoose Database Model Implementation**

The schema below defines a structured log to store, validate, and query payment verification states. It enforces uniqueness constraints and maps normalized attributes for auditing and dispute resolution:

JavaScript  
// models/payment.model.js  
const mongoose \= require('mongoose');

const paymentSchema \= new mongoose.Schema({  
  reference: {  
    type: String,  
    required: true,  
    unique: true, // Unique index prevents duplicate credit provisioning  
    trim: true,  
    uppercase: true,  
    index: true  
  },  
  provider: {  
    type: String,  
    required: true,  
    enum: \['telebirr', 'cbe', 'abyssinia', 'mpesa', 'cbebirr', 'dashen'\],  
    lowercase: true  
  },  
  amount: {  
    type: Number,  
    required: true,  
    min: 0.01  
  },  
  currency: {  
    type: String,  
    default: 'ETB'  
  },  
  payerName: {  
    type: String,  
    default: 'Anonymous Payer'  
  },  
  receiverAccount: {  
    type: String,  
    default: null  
  },  
  transactionDate: {  
    type: Date,  
    required: true  
  },  
  userId: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',  
    required: true  
  },  
  status: {  
    type: String,  
    enum: \['pending', 'completed', 'failed'\],  
    default: 'pending'  
  },  
  rawResponse: {  
    type: mongoose.Schema.Types.Mixed, // Stores the complete raw payload for audit trails  
    default: null  
  }  
}, {  
  timestamps: true  
});

// Compound index to optimize rapid verification checks by user and provider  
paymentSchema.index({ userId: 1, provider: 1 });

module.exports \= mongoose.model('Payment', paymentSchema);

## **Express Controller Implementation and Verification Flow**

The Express controller manages incoming client requests, orchestrates database checks, interacts with the @creofam/verifier SDK, and handles failures.1 In a MERN stack setup, a React frontend initiates the payment flow and prompts the user to input the transaction reference. The React client then posts this reference along with necessary metadata to the Express endpoint.

### **Core Controller Logic**

The payment controller utilizes the configured singleton client and enforces the validation flow:

JavaScript  
// controllers/payment.controller.js  
const verifierClient \= require('../config/verifier');  
const Payment \= require('../models/payment.model');  
const { RateLimitError, VerifierError } \= require('@creofam/verifier');

exports.verifyPayment \= async (req, res) \=\> {  
  const { provider, reference, suffix, accountSuffix, receiptNumber, amountExpected } \= req.body;  
  const userId \= req.user?.id || req.body.userId; // Fallback to body parameter if session is not present

  // 1\. Initial Validation  
  if (\!provider || (\!reference &&\!receiptNumber)) {  
    return res.status(400).json({  
      success: false,  
      message: "Missing core parameters. A valid provider and transaction reference are required."  
    });  
  }

  const queryReference \= reference || receiptNumber;

  // 2\. Database Idempotency Check  
  const existingTransaction \= await Payment.findOne({ reference: queryReference.toUpperCase() });  
  if (existingTransaction) {  
    return res.status(409).json({  
      success: false,  
      message: "This transaction reference has already been verified and processed."  
    });  
  }

  try {  
    let verificationResult;

    // 3\. Dynamic Execution based on Provider Selection  
    switch (provider.toLowerCase()) {  
      case 'telebirr':  
        verificationResult \= await verifierClient.verifyTelebirr({ reference: queryReference }, { mode: 'both' });  
        break;

      case 'cbe':  
        if (\!accountSuffix) {  
          return res.status(400).json({ success: false, message: "CBE verification requires the accountSuffix parameter." });  
        }  
        verificationResult \= await verifierClient.verifyCBE({ reference: queryReference, accountSuffix }, { mode: 'both' });  
        break;

      case 'abyssinia':  
        if (\!suffix) {  
          return res.status(400).json({ success: false, message: "Abyssinia verification requires the suffix parameter." });  
        }  
        verificationResult \= await verifierClient.verifyAbyssinia({ reference: queryReference, suffix }, { mode: 'both' });  
        break;

      case 'mpesa':  
        verificationResult \= await verifierClient.verifyMpesa({ receiptNumber: queryReference }, { mode: 'both' });  
        break;

      default:  
        return res.status(400).json({  
          success: false,  
          message: \`The payment provider '${provider}' is unsupported or undergoing maintenance.\`  
        });  
    }

    // 4\. Verification Check and Validation of Paid Amount  
    if (\!verificationResult.ok) {  
      return res.status(422).json({  
        success: false,  
        message: "Payment verification failed. The reference is invalid or does not exist.",  
        error: verificationResult.error  
      });  
    }

    const { data, raw } \= verificationResult;

    // Validate that the verified payment matches the amount expected in the database order  
    if (amountExpected && Number(data.amount) \< Number(amountExpected)) {  
      return res.status(400).json({  
        success: false,  
        message: \`Amount mismatch. Expected: ${amountExpected}, Verified: ${data.amount}.\`  
      });  
    }

    // 5\. Atomic Save of Completed Payment  
    const savedPayment \= new Payment({  
      reference: data.reference.toUpperCase(),  
      provider: verificationResult.provider,  
      amount: data.amount,  
      currency: data.currency || 'ETB',  
      payerName: data.payerName || 'Anonymous Payer',  
      receiverAccount: data.receiverAccount || null,  
      transactionDate: data.txnDate? new Date(data.txnDate) : new Date(),  
      userId,  
      status: 'completed',  
      rawResponse: raw // Save raw telemetry from Ethiopian provider nodes for auditing purposes  
    });

    await savedPayment.save();

    return res.status(200).json({  
      success: true,  
      message: "Transaction successfully verified and logged.",  
      data: {  
        reference: savedPayment.reference,  
        amount: savedPayment.amount,  
        payerName: savedPayment.payerName,  
        provider: savedPayment.provider  
      }  
    });

  } catch (error) {  
    console.error("SDK Verification Error Logged:", error);

    if (error instanceof RateLimitError) {  
      return res.status(429).json({  
        success: false,  
        message: "The verification gateway is currently throttled by the provider. Please retry shortly.",  
        retryAfterMs: error.status  
      });  
    }

    if (error instanceof VerifierError) {  
      return res.status(error.status || 502).json({  
        success: false,  
        message: "The payment gateway returned an error while querying transactions.",  
        details: error.message  
      });  
    }

    if (error.name \=== 'AbortError') {  
      return res.status(504).json({  
        success: false,  
        message: "The request timed out while communicating with local Ethiopian gateway nodes."  
      });  
    }

    return res.status(500).json({  
      success: false,  
      message: "An internal server error occurred during verification processing."  
    });  
  }  
};

## **Universal Routing Mechanics**

The SDK provides the verifyUniversal method to handle payment processing across different networks dynamically.1 By calling this endpoint, developers can offload the logic of pattern matching and provider mapping to the SDK.2 The upstream API parses the alphanumeric structure of the transaction reference, maps it to the respective bank pattern, and dispatches the query through its hybrid network proxy.2

JavaScript  
// routes/payment.routes.js  
const express \= require('express');  
const router \= express.Router();  
const verifierClient \= require('../config/verifier');  
const Payment \= require('../models/payment.model');

router.post('/verify-universal', async (req, res) \=\> {  
  const { reference, suffix, phoneNumber, amountExpected, userId } \= req.body;

  if (\!reference) {  
    return res.status(400).json({ success: false, message: "Reference parameter is required." });  
  }

  try {  
    const existing \= await Payment.findOne({ reference: reference.toUpperCase() });  
    if (existing) {  
      return res.status(409).json({ success: false, message: "Transaction already processed." });  
    }

    // Smart routing dispatch via Universal method   
    const result \= await verifierClient.verifyUniversal({  
      reference,  
      suffix,  
      phoneNumber  
    }, { mode: 'both' });

    if (\!result.ok) {  
      return res.status(422).json({ success: false, message: "Could not locate reference.", error: result.error });  
    }

    if (amountExpected && Number(result.data.amount) \< Number(amountExpected)) {  
      return res.status(400).json({ success: false, message: "Paid amount does not match order requirement." });  
    }

    const payment \= new Payment({  
      reference: result.data.reference.toUpperCase(),  
      provider: result.provider,  
      amount: result.data.amount,  
      payerName: result.data.payerName,  
      transactionDate: result.data.txnDate? new Date(result.data.txnDate) : new Date(),  
      userId,  
      status: 'completed',  
      rawResponse: result.raw  
    });

    await payment.save();

    return res.status(200).json({ success: true, verifiedData: payment });  
  } catch (err) {  
    return res.status(500).json({ success: false, message: err.message });  
  }  
});

module.exports \= router;

## **Production Security and Network Hardening**

When deploying payment verification systems to production, developers must account for latency, rate limiting, and network reliability.

### **Caching Strategy**

Because transaction records stored in bank ledgers are immutable, a successful verification remains valid permanently.3 Re-verifying a previously processed payment represents an unnecessary waste of execution credits and system resources.3  
Using the MongoDB schema designed above, the system checks for the presence of the unique payment reference *before* invoking the external network routing request.3 This database check acts as a high-speed cache, returning local verified payment information to the client in milliseconds and ensuring that remote network trips are reserved exclusively for new, unverified transactions.3

### **Rate Limiting and Backoff Mathematical Design**

Upstream APIs and bank ledgers limit maximum request volumes to prevent denial-of-service occurrences. The system rate limit can be calculated using the sliding window equation:  
![][image1]  
where ![][image2] is the maximum allowed requests in time interval ![][image3].3 To handle instances where ![][image4] is exceeded, the SDK relies on retry mechanisms governed by exponential backoff 1:  
![][image5]

* ![][image6] represents the initial delay configuration (retryDelayMs).1  
* ![][image7] represents the scaling factor (typically ![][image8] for standard exponential curve).  
* ![][image9] is the current retry attempt (bounded by max429Retries).1  
* ![][image10] is a randomized time offset added to prevent the herd effect on upstream databases.

By tuning max429Retries and retryDelayMs within the VerifierClient constructor, engineers can safely navigate high-concurrency billing events without throwing operational failures.1

#### **Works cited**

1. @creofam/verifier \- npm, accessed June 14, 2026, [https://www.npmjs.com/package/@creofam/verifier](https://www.npmjs.com/package/@creofam/verifier)  
2. Ethio biruks app @ ኢትዮ ብሩክስ አፕ – Telegram, accessed June 14, 2026, [https://telegram.me/s/ethio\_biruks\_app?q=%23community](https://telegram.me/s/ethio_biruks_app?q=%23community)  
3. How to verify emails via API (with code examples) \- Hunter Help Center, accessed June 14, 2026, [https://help.hunter.io/en/articles/12633706-how-to-verify-emails-via-api-with-code-examples](https://help.hunter.io/en/articles/12633706-how-to-verify-emails-via-api-with-code-examples)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA9CAYAAAAQ2DVeAAAC00lEQVR4Xu3dz6uPWRwH8CM/IiymGOkqkc0sxh1NTSllw0JSYkPsFPspbK/FNNlqahZzSxZMU/IHsEAUaykrdZOyY2WhhM/Hcx7f43KlfKfnm/t61bvvec5zvvvT55zznFIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGI87kbeRF03fmdqX+bnpBwBgIDORp5ENTd90ZFnzDADAQFZHZiN/RY40/ceaNgAAA9oXOR1ZFXkV2Rn5IfJfOwgAgOFkdW2qth+Vbmk0q2u/fxgBAMCg/omsrO2Z0h00OB/Z1Q8AAGBYe5r2ktLtZbtaHDgAAJgI6yPb5/XlHrZT8/oAAL4Lt8vo22XP6++5j0YAADC4nKTlqcvepXnPAAAMKDfuP4tsbfryFoF2jxgAAAPKidkftZ2b93+JXBu9BgBgaGcjDyK3Iq8jD0s3cfu/HY08+UK2jYYCACxuc6W75imtKd3Erb2b80L9zc9l7G36F7IpsrG2/40caN6NQ39A4msCAPBdeNO0cx9b7mfLK55STtK+5W7Oe5Gf5ndWuXcuJ3YLZfloKADA4pX3cOYErZeXqGdlKittf5bu1oCcvOUS6XRkc2RH5HLk78ivkUPv/9ldCfVj5HBkae3rq3MAAIxRVr4Olq66ljcH9K407Rulm8j1hxW21KS79XddWbi6BgDAGOSE62bkRH2+HzlZumrbxfp7vb7LZdPfIvvru92lq86tjRyvY8btcfn0oEIfnyQBABaNdh9Zf9F66pc8V3ymLydpvfY/45SHInL5NWWlby4yVZ9zOTcPPgAAMKC2gpZ769pL33MC104aAQAY2Gzpll8BAJhQL8uougYAwATygVwAgAnWHzgAAGBC5Yd722/FAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwADeAe4BW9c+jN1yAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABHElEQVR4XmNgGAWUAkcgfg3E/6F4BxBzIsnzAfEuJHkQXgfE3EhqUAAjEM8C4l9A/BOILVGlwSAIiNcwoFqEFQgC8UIgzmeA2DyFAWIBMigC4mg0MaxAH4j7gVgSiK8D8RMgVkSSZwHi2VB1BAHIxnQou4EB4rocuCwDgwgDxOUgHxAEfUBsDGXrAPF7ID4BxPxQMRsgngxl4wWw8ALZDgIgLy0H4n9A7AEVA7mapPBCDnCQISDDQIaCYo+s8IIBkPdA3gR514mByPACuQYUFqboEkAQwwCJiGtA3IkmhxWghxcyEGeAJBOQgUSFF8gLoKzBhS4BBQ1A/BaINdHEUYALEH9hQOQ1UBbyRlEBAaBkAsqrBMNrFIyCIQMA260zNBT6yKgAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAaCAYAAABozQZiAAAAvklEQVR4XmNgGLnACYjvAvEjIrELRBsDAyMQTwHilUCsAOWDwBwg/gfEHlA+MxDbA/EDIDaFijGIA/EqIBaDCQCBIBCfZoAolEYS5wHixUAsAxMAOaEQLg0B+kD8CYjXADELkjjI0ElAzAsTCAViNbg0BEQD8X8gLkcTFwbiNAaE17ACkH9/A7ENugQhgMu/RAFjIP7KgOlfogAu/xIEoICYzzAk/AuK43NA/I4B4lcY/gLE1xkgBo6CUUAeAAAc6iv7Yi1TmwAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAaCAYAAAAe97TpAAACi0lEQVR4Xu2WS6hNURjH/0J5JlyvvKIMlFySpEiKQhGZKEwIuTIhhAkDMwYeZYCMCJmYIMojUuaklAETRTJiQOL/69urs886x3Wvzq092P/6tc9ea+2zv299j7WlWrVq9aaV5qP5XeKT+WF+mZdmsxmcHqiyLpufZllpDMN3K5w5bAaV5iqn0eaZeWcmZXNTzPu/zFVKc80Xc9sMyeYWm+/mtenK5iqlDYpa2JNPWCcUcwez8crpnFrrYajZqYjQoeK+shplnii60Yvi9xvF7l8049PCKqtdPdCFjiq60upiLGmN+WyuqdGtiNIuMy0t6qfGmL3FNWmE+tHWUz0cyMYXmW+K1puL9CvXD8azjk72P+o2FxRZgXDmvsKGPqldPaCtCudOZeNjzVO1ru+kcIqW36du2Nv5gHM4cSQbJ/0eq/ECnLlj1hb3E8xZs9/MV0SI1Jttdph7Zp8iBUnHjeauWWCGKZrIA/NB8T/T9Q/NM1/Vej7w+5aanThuVikilNZPNNsUnyU3FTnM/XLzthjHUP7jlZmpaBSPFLvNhuD8MUUrT8rTta14Cadw/r1EfSRhAIWNM9vNJTNczS8YZyabqwrn0BxF8bOb5DhOlOeJCNGfqtiEGYpIpPQkXXGSQ7YjIsXWKzoUDrSrh1nmeXFNYudTLfHMQzWKdIu5rkbklxbzqTPl6dpxpRcsMZuKMaLCTmPMCjVSMUUV43ESo9IcjpB2OE5kcXqdIr2JGDVEzfSoue12ROQ0oT+pSAvEqX5Dca4QLaKHoykyGIyTpBVOXDGnFUXO2BlzXtEIuCfqRIY6WagBEh0EyqLLpYMJQ0aW5jC83DRYx/ok1nPPNYnnK/2ZU6tWrQHQH1jQerarQSzqAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAxCAYAAABnGvUlAAAFGUlEQVR4Xu3dW6guZRkH8CcyyVPmIU0NzMQTCiKRiIcbTS3TAkUQ9UIUzwreWBQIHhAx6MZjiJEiEqnohYcUw3YkKQiCFyp4IIxACEwQ9EZQ3z/v9zHjuNdpu/Zyrd3vBw975p3Zi/dbs+H787wzs6sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2HrOafW16SAAAAAAsISdWt3QatfpAQCAxbzU6oTp4DqwQ6unWu092/9rqyNm2+e2enO2vZ4kkGWeh43Gjqv+O/5Gq4NaHdNqt9Hx1fBBq0dm299r9WKr/YfDAMBGlvuoEiZWO0Cshotb/Xy0/+lo+wetfjfa3xrmQXFs3+nAxI9bfTLbTuC8pdXXh8O1Z6vnW105O76QfVrdPx1cxMetjp9t55o+2OrS4TAAsFGl43N4qz9WDwjrTQLbHqP9cWA7uNVZo/2t4aHJfoLQ7ZOxqZtrmOefWp04Ohb5POnALdXRXElg27nVq9XDYBzQ6j/VO20AwDYgXZjx8t3Wsnurp1v9e4G6bjh1s9JR2zQdXAOZ89GtLqilw1q82+ofrf7Q6v0alnBXaiWBLV3It6r/fj6q3uUbd/UAgA0uS2crWQ7dfjqwRhJK0r3anISU6bEjW73RapfJ+EqlS5XQlrCWjuRSshya+aQbl07b9Z87urhvVw9qqcz/4dH+Yh3Q22pYDv1+q8fri8utWYLNz8jDDpfPxnasIdgJeACwjiVcLFfu6XphOrhMCTBZDhwHkHElrCwkS36bqnfZNic32E+PbVfDTfhfxlXVw9pj1Ttti8kDB+mwzeeSJdHxMu5KLLfDlu7oe9U/byR8j+ewmHQC58uo944PAADrSx44yNOEd7c6qtXprW5q9c/qX+bXtvpR9fvJsnyabk7C1ymtXmv1SqtLqt9Pli5NluMSXFZTumvT4JNO0ZPVg8q8u/b36p8l80/HKfuRwPeT6t3EnHtZDfP9Sy083yvq812179bioW3aBUx42tIncJcb2O6o/sDB3LGt3qn+93/f6putTmr1TPXr+5saun7zhxIS+v42276zhmt+fvW551onsAIAX5F0Y9KJytLfXtVv5v9h9ZCT8JVwk+5Ljue8M6uHpHzZ52GFhJLvzLYjgWC1JCy8XT2spf5Xw430F1V/5UcCyU9nf+YhgfwPAhfWEC4jY1kizFJhzk3wms93upQ6duN0oPntdGDmvzXM81+zsfHcn52NLddyAtt9Nfz8BKpvVQ+yH7Y6r/r1i4TOfM5c3/zOEmZz3RLKIucmzEY+x/yaH1Q96ObfgvfGAcA6Mn4VxHw7X9aHVu/S5J6wPIWY5bTcZzX3RA3v/1oLCTNnVA8U6SD9onrQjDz5mo5Ruk0xDz7ppuXcnDef73KWDr8KCUlnTwe30H41fM5ftTqtekhLkEsX8bnq4e1nNfyucs0TghNyAYB15p7Rdr600225tfpTnpta/Xp2LJ2acdcl3a3cJJ9XVqyFU1s90Oqu6u86S/coy7rppqWL9mgNHbKce031hwdybuY9n+9Cy6HbknTaEgAj9+Nd3erk6t3QLJP+ufoyaQJcnm6dX/PcszhfKgUANriEpXS7EoI2wtLZyzXMd1t2SKvXa7iXDwD4P5aHEHKj//RVEutVwtpGmu+WSvfwl60OnB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgI3sM1aAtbW1Pp1+AAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAaCAYAAAAnkAWyAAACXElEQVR4Xu2XT0hUURTGP/EPCImkokGBbQwEQ1ASlCCJFrmJIAIhpFXZoo1CJBIhgguDIPqHiyAiogypRSAEokggUZDLNgUStApahK6E9Ps47/Jud3wzQzMyMzof/GDeue+dufe879z3HlBWWftTp8l38iNLzthlhVcFeUhmydHoWHpC/pKz0XElOUXWyIkoVnC1kNek2YsdJJ9hEz3sxQ+Q5+SIFyuoZIGRINZJ/pA5UuXFtaj7pM6LFVQXybEgdolskZtBvJFcRWytopT8vklOhgPFriS/l4S6yQZS/b6TtBP9Qvpz1R8vYT2067tUkt+TpAYeDoOB2skSaQoH8ik14lNk73dV9T0yn6uCpLs7eVE2ftfD6gJ5Q+6Qj7BnhVRLBmETvUvqo3h4d/wcQ6QPtrAG8oBMkmpYMZVPdy6jMvldCWfIdVjiKcTnaqJvYZOSzpMBWEGWEd8dnfsIcY5xWA7lvka6yApphdnsA+y5s6O0x38hv2Fed6yTr7AFOfWTVcSVVkVHo9+q7DdYJdUvrvKh33vJJ6Tm0KLayDnYE1/HavBFWAFylib1Alax0O/PyHQ05iv0u59DrxvziHO4ntM1kgqiZ05epD92u1AHzO+qpHypCvo71CHYrXd+vwyrfrocWsw7WMW1EC3SLSRnHYdVUd5UYy3AmlbW0ERfwf5MkxuDNfCt6NwrsAn5OdQ/fg6N3yD3yAT5iTR+/x9pp3AvZmqymmBM1VXcyVnMt1NSDl2rHlOv6BtDltLdKAk9hn1b6AVQTdvz73BxSzvfbZjViuaboaw9pW0j0HOhQID1LQAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABGklEQVR4Xu2TsUoDQRCGRxLBYBHSmMLGIhEEO1ubiEUeQVGfQEgbQppACnvBzt7GJhDfwWhhE0glaGOhaKpUouYbdpfb7BlcsArcBx/H7gx3c//tiWT8lxq+4Y/nB554Pd2g3sNVr57iEr9xPyxAFQd4jCtBLUUJ7/EJ12dLsod93Aj257KF73gjyZNz2MAzLNi9KI7EZNG0a83jQkxuS64plnP8xF3cxAe8xaLfFIPL6xlP8UrMjfRj1L2+KFxeX9jGZTwQ89p643zS+jcur5Yk+ZRxhGPctntR6Plyefl0xDxEr1G4vB7FTOOjE+lkOmFY+5UdnOC1pLPRte7rdHry56K/zIvM/m+veGjra3gX1IdYsfWMjMVlCn+/PCJqzkDYAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAaCAYAAACO5M0mAAAA1UlEQVR4XmNgGFpAEohrgXgWEDcCsQqqNASYAfFuILYFYn0g3grE/4G4GIgZYYo4gXgDECcBMTNUTBiITwHxVyA2hoqBrXwIxJ8YIKbBQBUDxNQimAArEE8E4p0MEE0wUM4AUQiicQIWIF4DxH+B2AFVChWYM0DcBwoBkI1YAT8Q7wHixUDMjSYHByDdM4C4jwESGjgBUQphiioZEOGpCcRucBUMkNAHxUIhlA0D6UAcBOOAJBKA+BsQPwHiR0j4HRDbwBTCYgYUuOj4ORArwRSOAsoBAOCsJ6IkC06cAAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAaCAYAAAB7GkaWAAAAnElEQVR4XmNgGHjADcSFQKyGLgECRUD8H4jT0SVAQASIHYCYFU0cN2AGYmMgtoGy4QBkxAQgrgXi00DciyzpCsQ1QMwHxAeAeCUDku5MINYHYksg/gbEETAJZNAAxE+AWBFNHOyFq0A8BYgZ0eQYPID4FxC7ALE6A8QUOJjBAHGpMAMklECOhAM/Boh9G4C4gAGL0TxALIAuOBIAANr5E9moi3bFAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAaCAYAAAD43n+tAAACpElEQVR4Xu2XS8iNURSGX7nkmtxCbqWEyCWMXEoIicRESYQoAwNCmPyRMkAxYEAZUaQMEFEukShTjAyYKCUjBiTep/V9nf3v8/kHOkfn5Lz1dM7+9t7f2WutvdbeR+qoo44aqaXmo/mV8Ml8Nz/NS7PR9C4ntIsumR9mUfIMI3YpDDtoeiV9La0h5ql5Z0ZnfWPN+z/0taymm8/mhumT9S0w38xrMzLra1mtU+TO7rzD6lL07c+et7TOqT5/+podisgdKNptocHmsaKqPS++v1VE5YIZUQ5sF1XlD9XssKK6rSieVWmtWZK0lxWUokoOTNqIdlOPgDJ/9mXP55mvinJeJYw/oZrBeRttMpeT9lBzT/Hupqkqf9BmhaEs8m+FM9JCM1txPDStWvZ0/mAoBh3KnqMp5qI5oigWY8x5c6xoz1FEhhvILbNTUVjumw/mrJmgEOfcUXPbbFVsd7bydbPQnDTHzYBifI+aab6o/vzhOy9MDeJHl5vxZm/x+crMMtsU3qeoTCrGk5uP1D0aOCmN2HzzRDEHQ1g4zqC64izWsFLh8PK9lVqsOP3LuxtwfyOfSnF/oyjw0i2KiOAlosEiOXAfmlGKiDGXsaVj2LJXVLsuDVOMZx7qb+4o5pBrZ8x2RVWdqIgs7yTi5F5DxDYk/CR6HnI8zbZiwRhxVbGwUnk08oix1d4oLse5xilSYXLe0SxhBMYQBcRiXyi2MJfZ4apFY65ZU4wlYnh8j2Kxz9S94s1QnIts7btmUNLXVOHldDFTFQZQFKYponlNcW3iOMAIovxAkRsYiTYoDm8ie9qsVjiLOV3FmH8iDGFx5EUpcgJKcXhSRVPhcYxLxRzyJv1r0k/14xoufvimwsOU3ba6rFYJD643p8yqot1RR/+jfgPjgXzHA6VL8wAAAABJRU5ErkJggg==>