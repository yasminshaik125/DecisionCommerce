import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

/* =========================================
   GROQ
========================================= */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================================
   SUPABASE SERVER CLIENT
========================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/*
  IMPORTANT:

  This key must NOT start with NEXT_PUBLIC_.

  The Service Role key is used only inside
  this server-side API route.

  Never expose it in frontend code.
*/

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Supabase server environment variables are missing."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/* =========================================
   TYPES
========================================= */

type MerchantRules = {
  discountsAllowed?: boolean;
  emiAvailable?: boolean;
  alternativeProductsAllowed?: boolean;
  bundleOptimizationAllowed?: boolean;
  maximumDiscountPercent?: number;
  maximumInterventionBudget?: number;
  approvalRequired?: boolean;
  outOfStockBlocked?: boolean;
  premiumProductRestricted?: boolean;
};

type ProductContext = {
  productName?: string;
  price?: number;
  ram?: string;
  processor?: string;
  battery?: string;
  features?: string;
  inStock?: boolean;
  premiumProduct?: boolean;
};

type InterventionCandidate = {
  name: string;
  description: string;
  estimatedCost: number;
  risk: "Low" | "Medium" | "High";
  barrierMatch: number;
  expectedBenefit: number;
  discountPercent?: number;
};

type InterventionStatus =
  | "Allowed"
  | "Blocked"
  | "Approval Required";

type EvaluatedIntervention =
  InterventionCandidate & {
    status: InterventionStatus;
    blockReason: string;
    approvalReason: string;
    score: number;
    ladderLevel: number;
    scoreBreakdown: {
      barrierMatchScore: number;
      expectedBenefitScore: number;
      confidenceScore: number;
      costScore: number;
      riskScore: number;
    };
  };

type AIAnalysis = {
  barrier: string;
  confidence: number;
  reason: string;
  interventions: InterventionCandidate[];
};

/* =========================================
   UTILITY FUNCTIONS
========================================= */

function clamp(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(maximum, numeric)
  );
}

/* =========================================
   NORMALIZE MERCHANT RULES
========================================= */

function normalizeRules(
  rules: MerchantRules
): MerchantRules {
  return {
    discountsAllowed:
      rules.discountsAllowed === true,

    emiAvailable:
      rules.emiAvailable === true,

    alternativeProductsAllowed:
      rules.alternativeProductsAllowed === true,

    bundleOptimizationAllowed:
      rules.bundleOptimizationAllowed === true,

    maximumDiscountPercent:
      clamp(
        rules.maximumDiscountPercent,
        0,
        100,
        0
      ),

    maximumInterventionBudget:
      clamp(
        rules.maximumInterventionBudget,
        0,
        100,
        100
      ),

    approvalRequired:
      rules.approvalRequired === true,

    outOfStockBlocked:
      rules.outOfStockBlocked === true,

    premiumProductRestricted:
      rules.premiumProductRestricted === true,
  };
}

/* =========================================
   NORMALIZE PRODUCT
========================================= */

function normalizeProduct(
  product: ProductContext
): ProductContext {
  return {
    productName:
      typeof product.productName === "string"
        ? product.productName.trim()
        : "",

    price:
      clamp(
        product.price,
        0,
        100000000,
        0
      ),

    ram:
      typeof product.ram === "string"
        ? product.ram
        : "",

    processor:
      typeof product.processor === "string"
        ? product.processor
        : "",

    battery:
      typeof product.battery === "string"
        ? product.battery
        : "",

    features:
      typeof product.features === "string"
        ? product.features
        : "",

    inStock:
      product.inStock !== false,

    premiumProduct:
      product.premiumProduct === true,
  };
}

/* =========================================
   CLEAN AI INTERVENTIONS
========================================= */

function cleanInterventions(
  interventions: unknown
): InterventionCandidate[] {
  if (!Array.isArray(interventions)) {
    return [];
  }

  const usedNames = new Set<string>();

  return interventions
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null
    )
    .map(
      (item): InterventionCandidate => {
        const intervention =
          item as Partial<InterventionCandidate>;

        const risk: InterventionCandidate["risk"] =
          intervention.risk === "High"
            ? "High"
            : intervention.risk === "Medium"
            ? "Medium"
            : "Low";

        return {
          name:
            typeof intervention.name === "string" &&
            intervention.name.trim()
              ? intervention.name.trim()
              : "Unknown Intervention",

          description:
            typeof intervention.description === "string"
              ? intervention.description.trim()
              : "No description available.",

          estimatedCost:
            clamp(
              intervention.estimatedCost,
              0,
              100,
              0
            ),

          risk,

          barrierMatch:
            clamp(
              intervention.barrierMatch,
              0,
              100,
              0
            ),

          expectedBenefit:
            clamp(
              intervention.expectedBenefit,
              0,
              100,
              0
            ),

          discountPercent:
            clamp(
              intervention.discountPercent,
              0,
              100,
              0
            ),
        };
      }
    )
    .filter((intervention) => {
      const key =
        intervention.name.toLowerCase();

      if (usedNames.has(key)) {
        return false;
      }

      usedNames.add(key);

      return true;
    })
    .slice(0, 5);
}

/* =========================================
   INTERVENTION LADDER
========================================= */

function getLadderLevel(
  interventionName: string
): number {
  const name =
    interventionName.toLowerCase();

  if (
    name.includes("clarif") ||
    name.includes("question") ||
    name.includes("feature explanation")
  ) {
    return 1;
  }

  if (
    name.includes("value") ||
    name.includes("trust") ||
    name.includes("evidence") ||
    name.includes("reliability")
  ) {
    return 2;
  }

  if (
    name.includes("compare") ||
    name.includes("comparison")
  ) {
    return 3;
  }

  if (name.includes("alternative")) {
    return 4;
  }

  if (
    name.includes("bundle") ||
    name.includes("optimization")
  ) {
    return 5;
  }

  if (
    name.includes("discount") ||
    name.includes("special price") ||
    name.includes("coupon")
  ) {
    return 6;
  }

  if (
    name.includes("emi") ||
    name.includes("payment")
  ) {
    return 4;
  }

  return 2;
}

/* =========================================
   EVALUATE INTERVENTIONS
========================================= */

function evaluateInterventions(
  interventions: InterventionCandidate[],
  rules: MerchantRules,
  confidence: number,
  product: ProductContext
): EvaluatedIntervention[] {
  const evaluated = interventions.map(
    (intervention) => {
      let status: InterventionStatus =
        "Allowed";

      let blockReason = "";
      let approvalReason = "";

      const name =
        intervention.name.toLowerCase();

      const ladderLevel =
        getLadderLevel(
          intervention.name
        );

      if (
        rules.outOfStockBlocked &&
        product.inStock === false
      ) {
        status = "Blocked";

        blockReason =
          "Product is currently out of stock.";
      }

      if (
        status !== "Blocked" &&
        rules.premiumProductRestricted &&
        product.premiumProduct &&
        (
          name.includes("discount") ||
          name.includes("alternative")
        )
      ) {
        status = "Blocked";

        blockReason =
          "Merchant has restricted this intervention for premium products.";
      }

      if (
        status !== "Blocked" &&
        name.includes("discount") &&
        !rules.discountsAllowed
      ) {
        status = "Blocked";

        blockReason =
          "Merchant has disabled discounts.";
      }

      if (
        status !== "Blocked" &&
        (
          name.includes("emi") ||
          name.includes("installment")
        ) &&
        !rules.emiAvailable
      ) {
        status = "Blocked";

        blockReason =
          "Merchant does not provide EMI.";
      }

      if (
        status !== "Blocked" &&
        name.includes("alternative") &&
        !rules.alternativeProductsAllowed
      ) {
        status = "Blocked";

        blockReason =
          "Merchant has disabled alternative product recommendations.";
      }

      if (
        status !== "Blocked" &&
        name.includes("bundle") &&
        !rules.bundleOptimizationAllowed
      ) {
        status = "Blocked";

        blockReason =
          "Merchant has disabled bundle optimization.";
      }

      if (
        status !== "Blocked" &&
        intervention.estimatedCost >
          (
            rules.maximumInterventionBudget ??
            100
          )
      ) {
        status = "Blocked";

        blockReason =
          "Intervention exceeds the merchant's maximum budget.";
      }

      /* FIXED:
         discountPercent can possibly be undefined,
         so we use ?? 0
      */

      if (
        status !== "Blocked" &&
        name.includes("discount") &&
        (
          intervention.discountPercent ?? 0
        ) >
          (
            rules.maximumDiscountPercent ??
            0
          )
      ) {
        status = "Blocked";

        blockReason =
          "Requested discount exceeds the merchant's maximum allowed discount.";
      }

      if (
        status === "Allowed" &&
        rules.approvalRequired &&
        (
          intervention.estimatedCost > 40 ||
          ladderLevel >= 5 ||
          name.includes("discount")
        )
      ) {
        status =
          "Approval Required";

        approvalReason =
          "This intervention requires merchant approval before being offered.";
      }

      const riskScore =
        intervention.risk === "Low"
          ? 100
          : intervention.risk === "Medium"
          ? 70
          : 40;

      const costScore =
        Math.max(
          0,
          100 -
            intervention.estimatedCost
        );

      const barrierMatchScore =
        intervention.barrierMatch;

      const expectedBenefitScore =
        intervention.expectedBenefit;

      const confidenceScore =
        confidence;

      const ladderPenalty =
        ladderLevel >= 6
          ? 8
          : ladderLevel === 5
          ? 4
          : 0;

      const score =
        status === "Blocked"
          ? 0
          : Math.max(
              0,
              Math.round(
                barrierMatchScore * 0.30 +
                  expectedBenefitScore * 0.25 +
                  confidenceScore * 0.15 +
                  costScore * 0.15 +
                  riskScore * 0.15 -
                  ladderPenalty
              )
            );

      return {
        ...intervention,
        status,
        blockReason,
        approvalReason,
        score,
        ladderLevel,

        scoreBreakdown: {
          barrierMatchScore,
          expectedBenefitScore,
          confidenceScore,
          costScore,
          riskScore,
        },
      };
    }
  );

  return evaluated.sort((a, b) => {
    const priority = {
      Allowed: 1,
      "Approval Required": 2,
      Blocked: 3,
    };

    if (
      priority[a.status] !==
      priority[b.status]
    ) {
      return (
        priority[a.status] -
        priority[b.status]
      );
    }

    if (
      a.ladderLevel !==
      b.ladderLevel
    ) {
      return (
        a.ladderLevel -
        b.ladderLevel
      );
    }

    return b.score - a.score;
  });
}

/* =========================================
   GENERATE AI ANALYSIS
========================================= */

async function generateAnalysis(
  customerMessage: string,
  product: ProductContext
): Promise<AIAnalysis> {
  const prompt = `
You are an advanced AI Decision Barrier Analysis Engine for e-commerce.

Your purpose is NOT simply to classify customer text.

Your purpose is to identify the customer's REAL decision barrier and recommend the minimum necessary intervention before escalating to costly actions.

CUSTOMER MESSAGE:

"${customerMessage}"

PRODUCT CONTEXT:

Product Name:
"${product.productName || "Not provided"}"

Price:
"${product.price || "Not provided"}"

RAM:
"${product.ram || "Not provided"}"

Processor:
"${product.processor || "Not provided"}"

Battery:
"${product.battery || "Not provided"}"

Features:
"${product.features || "Not provided"}"

In Stock:
"${product.inStock ? "Yes" : "No"}"

Premium Product:
"${product.premiumProduct ? "Yes" : "No"}"

Possible decision barriers:

- Price Concern
- Trust & Reliability Concern
- Product Fit Concern
- Feature Confusion
- Comparison Uncertainty
- Delivery Concern
- Payment Concern
- Purchase Uncertainty

Identify ONE main barrier.

Generate between 3 and 5 realistic intervention candidates.

Use gradual escalation.

Intervention ladder:

1. Clarification
2. Value Explanation
3. Trust / Evidence
4. Product Comparison
5. Alternative Product
6. Bundle Optimization
7. Discount or High-Cost Action

Do not immediately recommend a discount unless lower-cost interventions are less appropriate.

Return ONLY valid JSON.

Use exactly:

{
  "barrier": "string",
  "confidence": 90,
  "reason": "short explanation",
  "interventions": [
    {
      "name": "string",
      "description": "string",
      "estimatedCost": 0,
      "risk": "Low",
      "barrierMatch": 90,
      "expectedBenefit": 85,
      "discountPercent": 0
    }
  ]
}
`;

  const completion =
    await groq.chat.completions.create({
      model:
        "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",

          content:
            "You are a precise AI e-commerce decision barrier analysis engine. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.25,
      max_completion_tokens: 1000,

      response_format: {
        type: "json_object",
      },
    });

  const content =
    completion.choices[0]
      ?.message
      ?.content;

  if (!content) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  let result: unknown;

  try {
    result = JSON.parse(content);
  } catch {
    throw new Error(
      "AI returned invalid JSON."
    );
  }

  const analysis =
    result as {
      barrier?: unknown;
      confidence?: unknown;
      reason?: unknown;
      interventions?: unknown;
    };

  if (
    typeof analysis.barrier !== "string" ||
    typeof analysis.reason !== "string"
  ) {
    throw new Error(
      "AI returned an invalid analysis format."
    );
  }

  return {
    barrier:
      analysis.barrier.trim(),

    confidence:
      clamp(
        analysis.confidence,
        0,
        100,
        0
      ),

    reason:
      analysis.reason.trim(),

    interventions:
      cleanInterventions(
        analysis.interventions
      ),
  };
}

/* =========================================
   ANALYZE CUSTOMER REACTION
========================================= */

async function analyzeReaction(
  reaction: string,
  previousBarrier: string,
  selectedIntervention: string
) {
  const prompt = `
You are an AI Customer Reaction Analysis Engine.

Previous decision barrier:

"${previousBarrier}"

Selected intervention:

"${selectedIntervention}"

Customer reaction:

"${reaction}"

Determine whether the selected intervention resolved the customer's hesitation.

Possible results:

- Resolved
- Still Hesitating
- New Barrier

Use "Resolved" only when the customer's latest message clearly indicates the decision barrier is sufficiently resolved.

Return ONLY valid JSON:

{
  "reactionStatus": "Resolved",
  "confidence": 90,
  "reason": "short explanation",
  "currentBarrier": "string"
}
`;

  const completion =
    await groq.chat.completions.create({
      model:
        "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",

          content:
            "Analyze customer reactions precisely. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.2,
      max_completion_tokens: 400,

      response_format: {
        type: "json_object",
      },
    });

  const content =
    completion.choices[0]
      ?.message
      ?.content;

  if (!content) {
    throw new Error(
      "AI returned an empty reaction analysis."
    );
  }

  let data:
    Record<string, unknown>;

  try {
    data =
      JSON.parse(
        content
      ) as Record<string, unknown>;
  } catch {
    throw new Error(
      "AI returned invalid reaction JSON."
    );
  }

  const validStatuses = [
    "Resolved",
    "Still Hesitating",
    "New Barrier",
  ];

  const reactionStatus =
    typeof data.reactionStatus === "string" &&
    validStatuses.includes(
      data.reactionStatus
    )
      ? data.reactionStatus
      : "Still Hesitating";

  return {
    reactionStatus,

    confidence:
      clamp(
        data.confidence,
        0,
        100,
        0
      ),

    reason:
      typeof data.reason === "string"
        ? data.reason
        : "Customer reaction analyzed.",

    currentBarrier:
      reactionStatus === "Resolved"
        ? "None"
        : typeof data.currentBarrier ===
          "string"
        ? data.currentBarrier
        : "Purchase Uncertainty",
  };
}

/* =========================================
   DATABASE FUNCTIONS
========================================= */

async function saveInitialJourney(
  customerMessage: string,
  product: ProductContext
) {
  const { data, error } =
    await supabase
      .from("customer_journeys")
      .insert({
        customer_message:
          customerMessage,

        status:
          "Active",

        product_name:
          product.productName || null,

        product_price:
          product.price && product.price > 0
            ? product.price
            : null,

        product_ram:
          product.ram || null,

        product_processor:
          product.processor || null,

        product_battery:
          product.battery || null,

        product_features:
          product.features || null,

        product_in_stock:
          product.inStock,

        premium_product:
          product.premiumProduct,
      })
      .select()
      .single();

  if (error) {
    throw new Error(
      `Database journey error: ${error.message}`
    );
  }

  return data;
}

async function saveCustomerMessage(
  journeyId: string,
  message: string,
  messageType: string
) {
  const { error } =
    await supabase
      .from("customer_messages")
      .insert({
        journey_id: journeyId,
        message,
        message_type: messageType,
      });

  if (error) {
    throw new Error(
      `Database message error: ${error.message}`
    );
  }
}

async function saveBarrier(
  journeyId: string,
  barrierName: string,
  confidence: number,
  reason: string
) {
  const { data, error } =
    await supabase
      .from("barriers")
      .insert({
        journey_id: journeyId,
        barrier_name: barrierName,
        confidence,
        reason,
      })
      .select()
      .single();

  if (error) {
    throw new Error(
      `Database barrier error: ${error.message}`
    );
  }

  return data;
}

async function saveEvidence(
  barrierId: string,
  evidenceType: string,
  evidenceValue: string,
  score: number
) {
  const { error } =
    await supabase
      .from("evidence")
      .insert({
        barrier_id: barrierId,
        evidence_type: evidenceType,
        evidence_value: evidenceValue,
        score,
      });

  if (error) {
    throw new Error(
      `Database evidence error: ${error.message}`
    );
  }
}

async function saveInterventions(
  journeyId: string,
  barrierId: string,
  interventions: EvaluatedIntervention[]
) {
  const interventionRows =
    interventions.map(
      (intervention) => ({
        journey_id: journeyId,
        barrier_id: barrierId,
        name: intervention.name,
        description:
          intervention.description,
        estimated_cost:
          intervention.estimatedCost,
        risk: intervention.risk,
        barrier_match:
          intervention.barrierMatch,
        expected_benefit:
          intervention.expectedBenefit,
        discount_percent:
          intervention.discountPercent ?? 0,
        status: intervention.status,
        block_reason:
          intervention.blockReason,
        approval_reason:
          intervention.approvalReason,
        score: intervention.score,
        ladder_level:
          intervention.ladderLevel,
      })
    );

  const { data, error } =
    await supabase
      .from("interventions")
      .insert(interventionRows)
      .select();

  if (error) {
    throw new Error(
      `Database intervention error: ${error.message}`
    );
  }

  return data;
}

async function saveRoundHistory(
  journeyId: string,
  roundNumber: number,
  customerMessage: string,
  barrier: string,
  confidence: number,
  reason: string,
  selectedIntervention:
    | EvaluatedIntervention
    | null
) {
  const { error } =
    await supabase
      .from("round_history")
      .insert({
        journey_id: journeyId,
        round_number: roundNumber,
        customer_message:
          customerMessage,
        barrier,
        confidence,
        reason,

        selected_intervention:
          selectedIntervention?.name ??
          null,

        intervention_score:
          selectedIntervention?.score ??
          null,
      });

  if (error) {
    throw new Error(
      `Database round history error: ${error.message}`
    );
  }
}

async function updateLatestRoundReaction(
  journeyId: string,
  customerReaction: string,
  reactionStatus: string,
  reactionReason: string,
  decisionStatus: string
) {
  const { data: rounds, error } =
    await supabase
      .from("round_history")
      .select("id")
      .eq("journey_id", journeyId)
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1);

  if (error) {
    throw new Error(
      `Database round lookup error: ${error.message}`
    );
  }

  if (
    rounds &&
    rounds.length > 0
  ) {
    const { error: updateError } =
      await supabase
        .from("round_history")
        .update({
          customer_reaction:
            customerReaction,

          reaction_status:
            reactionStatus,

          reaction_reason:
            reactionReason,

          decision_status:
            decisionStatus,
        })
        .eq(
          "id",
          rounds[0].id
        );

    if (updateError) {
      throw new Error(
        `Database round update error: ${updateError.message}`
      );
    }
  }
}

/* =========================================
   POST API
========================================= */

export async function POST(
  request: Request
) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        {
          error:
            "GROQ_API_KEY is missing from .env.local",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const action =
      body.action === "reaction"
        ? "reaction"
        : "analyze";

    const rules =
      normalizeRules(
        body.rules &&
        typeof body.rules === "object"
          ? body.rules
          : {}
      );

    const product =
      normalizeProduct(
        body.product &&
        typeof body.product === "object"
          ? body.product
          : {}
      );

    /* =====================================
       INITIAL ANALYSIS
    ===================================== */

    if (action === "analyze") {
      const customerMessage =
        typeof body.customerMessage ===
        "string"
          ? body.customerMessage.trim()
          : "";

      if (!customerMessage) {
        return Response.json(
          {
            error:
              "Customer message is required.",
          },
          {
            status: 400,
          }
        );
      }

      const journey =
        await saveInitialJourney(
          customerMessage,
          product
        );

      const journeyId =
        journey.id;

      await saveCustomerMessage(
        journeyId,
        customerMessage,
        "Customer"
      );

      const aiAnalysis =
        await generateAnalysis(
          customerMessage,
          product
        );

      const barrier =
        await saveBarrier(
          journeyId,
          aiAnalysis.barrier,
          aiAnalysis.confidence,
          aiAnalysis.reason
        );

      await saveEvidence(
        barrier.id,
        "Customer Message",
        customerMessage,
        aiAnalysis.confidence
      );

      await saveEvidence(
        barrier.id,
        "AI Reasoning",
        aiAnalysis.reason,
        aiAnalysis.confidence
      );

      const rankedInterventions =
        evaluateInterventions(
          aiAnalysis.interventions,
          rules,
          aiAnalysis.confidence,
          product
        );

      const savedInterventions =
        await saveInterventions(
          journeyId,
          barrier.id,
          rankedInterventions
        );

      const selectedIntervention =
        rankedInterventions.find(
          (intervention) =>
            intervention.status ===
            "Allowed"
        ) ??
        rankedInterventions.find(
          (intervention) =>
            intervention.status ===
            "Approval Required"
        ) ??
        null;

      await saveRoundHistory(
        journeyId,
        1,
        customerMessage,
        aiAnalysis.barrier,
        aiAnalysis.confidence,
        aiAnalysis.reason,
        selectedIntervention
      );

      return Response.json({
        journeyId,

        barrier:
          aiAnalysis.barrier,

        confidence:
          aiAnalysis.confidence,

        reason:
          aiAnalysis.reason,

        interventions:
          rankedInterventions,

        savedInterventions,

        selectedIntervention,

        minimumNecessaryReason:
          selectedIntervention
            ? "Selected using barrier relevance, expected benefit, AI confidence, cost, risk, intervention ladder priority, and merchant constraints."
            : "No intervention is currently allowed by merchant rules.",
      });
    }

    /* =====================================
       CUSTOMER REACTION
    ===================================== */

    const journeyId =
      typeof body.journeyId === "string"
        ? body.journeyId
        : "";

    const reaction =
      typeof body.reaction === "string"
        ? body.reaction.trim()
        : "";

    const previousBarrier =
      typeof body.previousBarrier ===
      "string"
        ? body.previousBarrier
        : "Unknown";

    const selectedIntervention =
      typeof body.selectedIntervention ===
      "string"
        ? body.selectedIntervention
        : "Unknown";

    const roundNumber =
      Number.isFinite(
        Number(body.roundNumber)
      )
        ? Math.max(
            1,
            Math.floor(
              Number(body.roundNumber)
            )
          )
        : 1;

    if (!journeyId) {
      return Response.json(
        {
          error:
            "Journey ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reaction) {
      return Response.json(
        {
          error:
            "Customer reaction is required.",
        },
        {
          status: 400,
        }
      );
    }

    await saveCustomerMessage(
      journeyId,
      reaction,
      "Reaction"
    );

    const reactionAnalysis =
      await analyzeReaction(
        reaction,
        previousBarrier,
        selectedIntervention
      );

    const {
      data: interventionData,
      error: interventionLookupError,
    } =
      await supabase
        .from("interventions")
        .select("id")
        .eq(
          "journey_id",
          journeyId
        )
        .eq(
          "name",
          selectedIntervention
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

    if (interventionLookupError) {
      throw new Error(
        `Database intervention lookup error: ${interventionLookupError.message}`
      );
    }

    const interventionId =
      interventionData?.[0]?.id ??
      null;

    const {
      error: reactionInsertError,
    } =
      await supabase
        .from("reactions")
        .insert({
          journey_id: journeyId,

          intervention_id:
            interventionId,

          customer_reaction:
            reaction,

          reaction_status:
            reactionAnalysis.reactionStatus,

          confidence:
            reactionAnalysis.confidence,

          reason:
            reactionAnalysis.reason,

          current_barrier:
            reactionAnalysis.currentBarrier,

          decision_status:
            reactionAnalysis.reactionStatus ===
            "Resolved"
              ? "Likely Ready to Purchase"
              : "Still Evaluating",
        });

    if (reactionInsertError) {
      throw new Error(
        `Database reaction error: ${reactionInsertError.message}`
      );
    }

    /* =====================================
       JOURNEY RESOLVED
    ===================================== */

    if (
      reactionAnalysis.reactionStatus ===
      "Resolved"
    ) {
      await updateLatestRoundReaction(
        journeyId,
        reaction,
        reactionAnalysis.reactionStatus,
        reactionAnalysis.reason,
        "Likely Ready to Purchase"
      );

      const {
        error: journeyUpdateError,
      } =
        await supabase
          .from("customer_journeys")
          .update({
            status:
              "Likely Ready to Purchase",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            journeyId
          );

      if (journeyUpdateError) {
        throw new Error(
          `Database journey update error: ${journeyUpdateError.message}`
        );
      }

      return Response.json({
        journeyId,
        reactionAnalysis,

        reDiagnosedAnalysis:
          null,

        decisionStatus:
          "Likely Ready to Purchase",

        message:
          "The customer's hesitation appears to be resolved.",
      });
    }

    /* =====================================
       STILL EVALUATING
    ===================================== */

    await updateLatestRoundReaction(
      journeyId,
      reaction,
      reactionAnalysis.reactionStatus,
      reactionAnalysis.reason,
      "Still Evaluating"
    );

    const reDiagnosisMessage = `
This is a new round in an ongoing customer decision journey.

Previous decision barrier:

"${previousBarrier}"

Previous intervention:

"${selectedIntervention}"

Latest customer reaction:

"${reaction}"

Analyze the customer's CURRENT hesitation.

Do not simply repeat the previous barrier unless the latest reaction clearly shows that the same barrier still remains.

Identify the new main decision barrier and generate new intervention candidates using gradual escalation.
`;

    const newAnalysis =
      await generateAnalysis(
        reDiagnosisMessage,
        product
      );

    const newBarrier =
      await saveBarrier(
        journeyId,
        newAnalysis.barrier,
        newAnalysis.confidence,
        newAnalysis.reason
      );

    await saveEvidence(
      newBarrier.id,
      "Customer Reaction",
      reaction,
      newAnalysis.confidence
    );

    await saveEvidence(
      newBarrier.id,
      "AI Re-Diagnosis",
      newAnalysis.reason,
      newAnalysis.confidence
    );

    const rankedInterventions =
      evaluateInterventions(
        newAnalysis.interventions,
        rules,
        newAnalysis.confidence,
        product
      );

    await saveInterventions(
      journeyId,
      newBarrier.id,
      rankedInterventions
    );

    const newSelectedIntervention =
      rankedInterventions.find(
        (intervention) =>
          intervention.status ===
          "Allowed"
      ) ??
      rankedInterventions.find(
        (intervention) =>
          intervention.status ===
          "Approval Required"
      ) ??
      null;

    await saveRoundHistory(
      journeyId,
      roundNumber + 1,
      reaction,
      newAnalysis.barrier,
      newAnalysis.confidence,
      newAnalysis.reason,
      newSelectedIntervention
    );

    const {
      error: journeyUpdateError,
    } =
      await supabase
        .from("customer_journeys")
        .update({
          status:
            "Still Evaluating",

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          journeyId
        );

    if (journeyUpdateError) {
      throw new Error(
        `Database journey update error: ${journeyUpdateError.message}`
      );
    }

    return Response.json({
      journeyId,
      reactionAnalysis,

      reDiagnosedAnalysis: {
        barrier:
          newAnalysis.barrier,

        confidence:
          newAnalysis.confidence,

        reason:
          newAnalysis.reason,

        interventions:
          rankedInterventions,

        selectedIntervention:
          newSelectedIntervention,

        minimumNecessaryReason:
          newSelectedIntervention
            ? "A new intervention cycle was created using the latest customer reaction, expected benefit, confidence, intervention ladder, product context, and merchant rules."
            : "The current barrier was detected, but no suitable intervention is currently allowed.",
      },

      decisionStatus:
        "Still Evaluating",

      message:
        "The customer is still evaluating. The AI re-diagnosed the latest barrier and started the next decision round.",
    });

  } catch (error: unknown) {
    console.error(
      "AI analysis error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to process request.";

    return Response.json(
      {
        error:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}