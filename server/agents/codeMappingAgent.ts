import { z } from "zod";
import {
  CodeMappingModel,
  ICD11CodeModel,
  NamasteCodeModel,
  connectToMongo,
  type NamasteCategory,
} from "../lib/mongodb";
import { createGroqChatCompletion, extractGroqText, getGroqApiKey, type GroqChatResponse } from "../lib/groq";

const agentInputSchema = z.object({
  query: z.string().trim().min(1),
  category: z.enum(["Ayurveda", "Siddha", "Unani"]).optional(),
});

export type AgentInput = z.infer<typeof agentInputSchema>;

interface ParsedInput {
  originalQuery: string;
  normalizedQuery: string;
  keywords: string[];
  category?: NamasteCategory;
}

interface NamasteCandidate {
  code: string;
  name: string;
  description: string;
  category: NamasteCategory;
  symptoms: string[];
}

interface ScoredCandidate extends NamasteCandidate {
  confidence: number;
  keywordScore: number;
  categoryScore: number;
  mappingScore: number;
  mappingCount: number;
}

export interface AgentResult {
  namaste_code: string;
  namaste_name: string;
  icd11_code: string | null;
  icd11_name: string | null;
  confidence: number;
  status: "mapped" | "unmapped" | "partial";
  reasoning: string;
  symptoms: string[];
}

export interface ApiSuggestion {
  namaste_code: string | null;
  namaste_name: string;
  icd11_code: string | null;
  icd11_name: string | null;
  category: NamasteCategory | null;
  description: string | null;
  symptoms: string[];
  chapter: string | null;
  confidence: number;
  reasoning: string;
  storedInMongo: boolean;
}

export interface AgentRunResponse {
  results: AgentResult[];
  apiSuggestions: ApiSuggestion[];
  aiUsed: boolean;
  aiMessage?: string;
  apiSuggestionMessage?: string;
}

interface GroqCandidate {
  namaste_code: string;
  confidence?: number;
  reasoning?: string;
}

const apiSuggestionSchema = z.object({
  namaste_code: z.string().trim().min(1).nullable().optional(),
  namaste_name: z.string().trim().min(1),
  icd11_code: z.string().trim().min(1).nullable().optional(),
  icd11_name: z.string().trim().min(1).nullable().optional(),
  category: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1).nullable().optional(),
  symptoms: z.array(z.string().trim().min(1)).optional(),
  chapter: z.string().trim().min(1).nullable().optional(),
  confidence: z.number().min(0).max(100).optional(),
  reasoning: z.string().trim().min(1),
});

function normalizeSuggestedCategory(value: string | null | undefined, fallback?: NamasteCategory): NamasteCategory | null {
  if (!value) {
    return fallback ?? null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "ayurveda") {
    return "Ayurveda";
  }

  if (normalized === "siddha") {
    return "Siddha";
  }

  if (normalized === "unani") {
    return "Unani";
  }

  return fallback ?? null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function extractKeywords(normalizedQuery: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "for",
    "from",
    "in",
    "is",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
  ]);

  return normalizedQuery
    .split(" ")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 1 && !stopWords.has(keyword));
}

async function parseInput(input: AgentInput): Promise<ParsedInput> {
  console.log("[Agent Step 1] Parsing input...");
  const validated = agentInputSchema.parse(input);
  const normalizedQuery = normalizeText(validated.query);
  const keywords = extractKeywords(normalizedQuery);

  return {
    originalQuery: validated.query,
    normalizedQuery,
    keywords,
    category: validated.category,
  };
}

function buildRegexConditions(keywords: string[]) {
  return keywords.flatMap((keyword) => [
    { name: { $regex: keyword, $options: "i" } },
    { description: { $regex: keyword, $options: "i" } },
    { symptoms: { $elemMatch: { $regex: keyword, $options: "i" } } },
    { code: { $regex: keyword, $options: "i" } },
  ]);
}

async function searchNamasteDb(parsed: ParsedInput): Promise<NamasteCandidate[]> {
  console.log("[Agent Step 2] Searching NAMASTE DB...");

  const categoryFilter = parsed.category ? { category: parsed.category } : {};
  const keywordSearch = parsed.keywords.join(" ");

  const textMatches = keywordSearch
    ? await NamasteCodeModel.find({
        ...categoryFilter,
        $text: { $search: keywordSearch },
      })
        .limit(5)
        .lean()
        .exec()
    : [];

  const regexMatches =
    textMatches.length < 5
      ? await NamasteCodeModel.find({
          ...categoryFilter,
          $or: buildRegexConditions(parsed.keywords.length > 0 ? parsed.keywords : [parsed.normalizedQuery]),
        })
          .limit(10)
          .lean()
          .exec()
      : [];

  const combined = [...textMatches, ...regexMatches];
  const uniqueCandidates = new Map<string, NamasteCandidate>();

  combined.forEach((candidate) => {
    if (!uniqueCandidates.has(candidate.code)) {
      uniqueCandidates.set(candidate.code, {
        code: candidate.code,
        name: candidate.name,
        description: candidate.description,
        category: candidate.category,
        symptoms: candidate.symptoms,
      });
    }
  });

  if (uniqueCandidates.size === 0) {
    const fallbacks = await NamasteCodeModel.find(categoryFilter).limit(3).lean().exec();
    fallbacks.forEach((candidate) => {
      uniqueCandidates.set(candidate.code, {
        code: candidate.code,
        name: candidate.name,
        description: candidate.description,
        category: candidate.category,
        symptoms: candidate.symptoms,
      });
    });
  }

  return Array.from(uniqueCandidates.values()).slice(0, 5);
}

function calculateKeywordOverlap(parsed: ParsedInput, candidate: NamasteCandidate): number {
  const haystack = normalizeText(
    [candidate.code, candidate.name, candidate.description, ...candidate.symptoms].join(" "),
  );

  if (parsed.keywords.length === 0) {
    return haystack.includes(parsed.normalizedQuery) ? 1 : 0;
  }

  const matchedKeywords = parsed.keywords.filter((keyword) => haystack.includes(keyword));
  return matchedKeywords.length / parsed.keywords.length;
}

async function scoreCandidates(parsed: ParsedInput, candidates: NamasteCandidate[]): Promise<ScoredCandidate[]> {
  console.log("[Agent Step 3] Scoring candidates...");

  const mappingCounts = await Promise.all(
    candidates.map(async (candidate) => {
      const mapping = await CodeMappingModel.findOne({ namaste_code: candidate.code })
        .sort({ mappingCount: -1, updatedAt: -1 })
        .lean()
        .exec();

      return mapping?.mappingCount ?? 0;
    }),
  );

  const maxMappingCount = Math.max(...mappingCounts, 1);

  const scored = candidates.map((candidate, index) => {
    const keywordScore = calculateKeywordOverlap(parsed, candidate) * 40;
    const categoryScore = parsed.category
      ? candidate.category === parsed.category
        ? 30
        : 0
      : 15;
    const mappingScore = (mappingCounts[index] / maxMappingCount) * 30;
    const confidence = Math.round(keywordScore + categoryScore + mappingScore);

    return {
      ...candidate,
      confidence,
      keywordScore,
      categoryScore,
      mappingScore,
      mappingCount: mappingCounts[index],
    };
  });

  return scored.sort((left, right) => right.confidence - left.confidence);
}

function buildReasoning(candidate: ScoredCandidate, status: AgentResult["status"]): string {
  const categoryFragment =
    candidate.categoryScore > 0 ? `category alignment for ${candidate.category}` : "text similarity";
  const mappingFragment =
    candidate.mappingCount > 0
      ? `historical mapping usage (${candidate.mappingCount})`
      : "no prior mapping history";
  const statusFragment =
    status === "mapped"
      ? "a verified ICD-11 link was found"
      : status === "partial"
      ? "the candidate matched strongly but ICD-11 details were incomplete"
      : "no ICD-11 mapping exists yet";

  return `Chosen for strong keyword overlap, ${categoryFragment}, and ${mappingFragment}; ${statusFragment}.`;
}

async function crossCheckIcd11(scoredCandidates: ScoredCandidate[]): Promise<AgentResult[]> {
  console.log("[Agent Step 4] Cross-checking ICD-11 mappings...");

  const topCandidates = scoredCandidates.slice(0, 3);
  const results = await Promise.all(
    topCandidates.map(async (candidate) => {
      const mapping = await CodeMappingModel.findOne({ namaste_code: candidate.code })
        .sort({ mappingCount: -1, updatedAt: -1 })
        .lean()
        .exec();

      if (!mapping) {
        return {
          namaste_code: candidate.code,
          namaste_name: candidate.name,
          icd11_code: null,
          icd11_name: null,
          confidence: candidate.confidence,
          status: "unmapped" as const,
          reasoning: buildReasoning(candidate, "unmapped"),
          symptoms: candidate.symptoms,
        };
      }

      const icd11 = await ICD11CodeModel.findOne({ code: mapping.icd11_code }).lean().exec();
      const status = icd11 ? ("mapped" as const) : ("partial" as const);

      return {
        namaste_code: candidate.code,
        namaste_name: candidate.name,
        icd11_code: mapping.icd11_code ?? null,
        icd11_name: icd11?.name ?? null,
        confidence: candidate.confidence,
        status,
        reasoning: buildReasoning(candidate, status),
        symptoms: candidate.symptoms,
      };
    }),
  );

  return results;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeApiConfidence(value: number | undefined | null): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value >= 0 && value <= 1) {
    return clampConfidence(value * 100);
  }

  return clampConfidence(value);
}

function calculateSuggestionConfidence(
  parsed: ParsedInput,
  suggestion: {
    namaste_code: string | null;
    namaste_name: string;
    icd11_code: string | null;
    icd11_name: string | null;
    category: NamasteCategory | null;
    description: string | null;
    symptoms: string[];
    chapter: string | null;
    confidence: number | null;
  },
  storedInMongo: boolean,
): number {
  const haystack = normalizeText(
    [
      suggestion.namaste_code ?? "",
      suggestion.namaste_name,
      suggestion.icd11_code ?? "",
      suggestion.icd11_name ?? "",
      suggestion.description ?? "",
      suggestion.chapter ?? "",
      ...suggestion.symptoms,
    ].join(" "),
  );

  const overlap = parsed.keywords.length
    ? parsed.keywords.filter((keyword) => haystack.includes(keyword)).length / parsed.keywords.length
    : parsed.normalizedQuery && haystack.includes(parsed.normalizedQuery)
    ? 1
    : 0;

  const completenessScore = [
    suggestion.namaste_code,
    suggestion.icd11_code,
    suggestion.icd11_name,
    suggestion.description,
    suggestion.category,
  ].filter(Boolean).length * 6;

  const symptomScore = Math.min(15, suggestion.symptoms.length * 5);
  const categoryScore = parsed.category && suggestion.category === parsed.category ? 10 : 0;
  const storedScore = storedInMongo ? 8 : 0;
  const heuristicScore = 30 + overlap * 35 + completenessScore + symptomScore + categoryScore + storedScore;

  if (suggestion.confidence === null) {
    return clampConfidence(heuristicScore);
  }

  return clampConfidence(suggestion.confidence * 0.55 + heuristicScore * 0.45);
}

function extractJsonArray(text: string): string | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  return arrayMatch?.[0] ?? null;
}

async function refineWithGroq(
  parsed: ParsedInput,
  results: AgentResult[],
): Promise<{ results: AgentResult[]; aiUsed: boolean; aiMessage?: string }> {
  console.log("[Agent Step 5] Refining ranked matches with Groq...");

  if (!getGroqApiKey() || results.length === 0) {
    return {
      results,
      aiUsed: false,
      aiMessage: !getGroqApiKey() ? "Groq API key is missing." : "No ranked results were available for AI refinement.",
    };
  }

  const prompt = [
    "You are an ICD-11 mapping assistant for traditional Indian medicine.",
    "Review the ranked shortlist below and improve only the confidence and reasoning.",
    "Do not invent new candidate codes. Only use namaste_code values already provided.",
    "Return strict JSON array with objects: namaste_code, confidence, reasoning.",
    `User query: ${parsed.originalQuery}`,
    `Normalized keywords: ${parsed.keywords.join(", ") || "none"}`,
    `Category: ${parsed.category ?? "not provided"}`,
    `Current results: ${JSON.stringify(results)}`,
  ].join("\n");

  try {
    const data = (await createGroqChatCompletion(prompt, 0.2)) as GroqChatResponse;

    if (data.error?.message) {
      return {
        results,
        aiUsed: false,
        aiMessage: `Groq error: ${data.error.message}`,
      };
    }

    const modelText = extractGroqText(data);
    if (!modelText) {
      return {
        results,
        aiUsed: false,
        aiMessage: "Groq returned no candidate text.",
      };
    }

    const jsonArray = extractJsonArray(modelText);
    if (!jsonArray) {
      return {
        results,
        aiUsed: false,
        aiMessage: "Groq returned text, but it was not valid JSON for the agent.",
      };
    }

    const parsedCandidates = JSON.parse(jsonArray) as GroqCandidate[];
    const candidateMap = new Map(parsedCandidates.map((candidate) => [candidate.namaste_code, candidate]));

    return {
      results: results
        .map((result) => {
          const aiCandidate = candidateMap.get(result.namaste_code);

          if (!aiCandidate) {
            return result;
          }

          return {
            ...result,
            confidence:
              typeof aiCandidate.confidence === "number"
                ? clampConfidence(aiCandidate.confidence)
                : result.confidence,
            reasoning: aiCandidate.reasoning?.trim() || result.reasoning,
            symptoms: result.symptoms,
          };
        })
        .sort((left, right) => right.confidence - left.confidence)
        .slice(0, 3),
      aiUsed: true,
      aiMessage: "Groq refinement applied successfully.",
    };
  } catch (error) {
    console.error("[Agent AI] Groq refinement failed:", error);
    return {
      results,
      aiUsed: false,
      aiMessage: error instanceof Error ? error.message : "Groq refinement failed.",
    };
  }
}

function sortAndLimitResults(results: AgentResult[]): AgentResult[] {
  return [...results].sort((left, right) => right.confidence - left.confidence).slice(0, 3);
}

async function generateApiSuggestions(
  parsed: ParsedInput,
  results: AgentResult[],
): Promise<{ apiSuggestions: ApiSuggestion[]; apiSuggestionMessage?: string }> {
  if (!getGroqApiKey()) {
    return {
      apiSuggestions: [],
      apiSuggestionMessage: "Groq API key is missing, so external suggestions are unavailable.",
    };
  }

  const prompt = [
    "You are helping with ICD-11 and traditional Indian medicine code mapping.",
    "The MongoDB collections did not contain a confident stored match for the user query.",
    "Suggest up to 3 possible mappings that are NOT stored in MongoDB yet.",
    "These suggestions must be presented as possibilities only, not verified facts.",
    "Return strict JSON array with objects: namaste_code, namaste_name, icd11_code, icd11_name, category, description, symptoms, chapter, confidence, reasoning.",
    "If you do not know a field, return null for scalar fields and [] for symptoms.",
    "Confidence must be a percentage from 0 to 100, where 100 means strongest possible match.",
    "Do not repeat any namaste_code already present in the stored results list.",
    `User query: ${parsed.originalQuery}`,
    `Normalized keywords: ${parsed.keywords.join(", ") || "none"}`,
    `Category: ${parsed.category ?? "not provided"}`,
    `Stored Mongo results: ${JSON.stringify(results)}`,
  ].join("\n");

  try {
    const data = (await createGroqChatCompletion(prompt, 0.2)) as GroqChatResponse;
    const modelText = extractGroqText(data);

    if (!modelText) {
      return {
        apiSuggestions: [],
        apiSuggestionMessage: "Groq did not return external fallback suggestions.",
      };
    }

    const jsonArray = extractJsonArray(modelText);
    if (!jsonArray) {
      return {
        apiSuggestions: [],
        apiSuggestionMessage: "Groq returned fallback text, but it was not valid JSON.",
      };
    }

    const parsedSuggestions = z.array(apiSuggestionSchema).parse(JSON.parse(jsonArray));
    const resultCodeSet = new Set(results.map((result) => result.namaste_code));

    const normalizedSuggestions = parsedSuggestions.slice(0, 5).map((suggestion) => ({
      namaste_code: suggestion.namaste_code ?? null,
      namaste_name: suggestion.namaste_name,
      icd11_code: suggestion.icd11_code ?? null,
      icd11_name: suggestion.icd11_name ?? null,
      category: normalizeSuggestedCategory(suggestion.category, parsed.category),
      description: suggestion.description ?? null,
      symptoms: suggestion.symptoms ?? [],
      chapter: suggestion.chapter ?? null,
      confidence: normalizeApiConfidence(suggestion.confidence),
      reasoning: suggestion.reasoning,
    }));

    const existingNamasteCodes = normalizedSuggestions
      .map((suggestion) => suggestion.namaste_code)
      .filter((code): code is string => Boolean(code));

    const storedNamasteRecords =
      existingNamasteCodes.length > 0
        ? await NamasteCodeModel.find({ code: { $in: existingNamasteCodes } }).select({ code: 1 }).lean().exec()
        : [];

    const storedCodeSet = new Set(storedNamasteRecords.map((record) => record.code));

    const apiSuggestions: ApiSuggestion[] = normalizedSuggestions
      .map((suggestion) => {
        const storedInMongo =
          (suggestion.namaste_code ? storedCodeSet.has(suggestion.namaste_code) : false) ||
          (suggestion.namaste_code ? resultCodeSet.has(suggestion.namaste_code) : false);

        return {
          ...suggestion,
          confidence: calculateSuggestionConfidence(parsed, suggestion, storedInMongo),
          storedInMongo,
        };
      })
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 3);

    return {
      apiSuggestions,
      apiSuggestionMessage: apiSuggestions.length
        ? "MongoDB matches and API recommendations are shown together. Recommendations already stored in MongoDB are marked and cannot be added again."
        : "No additional API-generated suggestions were available.",
    };
  } catch (error) {
    console.error("[Agent AI] Groq external suggestions failed:", error);
    return {
      apiSuggestions: [],
      apiSuggestionMessage: error instanceof Error ? error.message : "Groq external suggestion lookup failed.",
    };
  }
}

function buildFallbackResult(parsed: ParsedInput): AgentRunResponse {
  if (!parsed.originalQuery) {
    return { results: [], apiSuggestions: [], aiUsed: false, aiMessage: "No query was provided." };
  }

  return {
    results: [
      {
        namaste_code: "N/A",
        namaste_name: parsed.originalQuery,
        icd11_code: null,
        icd11_name: null,
        confidence: 0,
        status: "unmapped",
        reasoning: "The agent could not complete all planning steps, so no confident mapping could be produced.",
        symptoms: [],
      },
    ],
    apiSuggestions: [],
    aiUsed: false,
    aiMessage: "The agent could not complete all planning steps.",
  };
}

export async function runCodeMappingAgent(input: AgentInput): Promise<AgentRunResponse> {
  let parsedInput: ParsedInput = {
    originalQuery: input.query,
    normalizedQuery: "",
    keywords: [],
    category: input.category,
  };

  try {
    await connectToMongo();
    parsedInput = await parseInput(input);
    const candidates = await searchNamasteDb(parsedInput);

    if (candidates.length === 0) {
      const fallbackSuggestions = await generateApiSuggestions(parsedInput, []);
      return {
        results: [],
        apiSuggestions: fallbackSuggestions.apiSuggestions,
        aiUsed: false,
        apiSuggestionMessage: fallbackSuggestions.apiSuggestionMessage,
      };
    }

    const scoredCandidates = await scoreCandidates(parsedInput, candidates);
    const crossCheckedResults = await crossCheckIcd11(scoredCandidates);
    const refined = await refineWithGroq(parsedInput, crossCheckedResults);
    const sortedResults = sortAndLimitResults(refined.results);
    const fallbackSuggestions = await generateApiSuggestions(parsedInput, sortedResults);

    return {
      results: sortedResults,
      apiSuggestions: fallbackSuggestions.apiSuggestions,
      aiUsed: refined.aiUsed,
      aiMessage: refined.aiMessage,
      apiSuggestionMessage: fallbackSuggestions.apiSuggestionMessage,
    };
  } catch (error) {
    console.error("[Agent Error] Code mapping agent failed:", error);
    return buildFallbackResult(parsedInput);
  }
}
