import { Router } from "express";
import { z } from "zod";
import { runCodeMappingAgent } from "../agents/codeMappingAgent";
import {
  CodeMappingModel,
  ICD11CodeModel,
  NamasteCodeModel,
  namasteCategories,
  type NamasteCategory,
} from "../lib/mongodb";

const router = Router();
const categoryEnum = z.enum(namasteCategories);

const requestSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  category: categoryEnum.optional(),
});

const namasteCodeSchema = z.object({
  code: z.string().trim().min(1, "NAMASTE code is required"),
  name: z.string().trim().min(1, "NAMASTE name is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: categoryEnum,
  symptoms: z.array(z.string().trim().min(1)).default([]),
});

const icd11CodeSchema = z.object({
  code: z.string().trim().min(1, "ICD-11 code is required"),
  name: z.string().trim().min(1, "ICD-11 name is required"),
  description: z.string().trim().min(1, "Description is required"),
  chapter: z.string().trim().min(1, "Chapter is required"),
});

const codeMappingSchema = z.object({
  namaste_code: z.string().trim().min(1, "NAMASTE code is required"),
  icd11_code: z.string().trim().min(1, "ICD-11 code is required"),
  confidence: z.number().min(0).max(100),
  status: z.enum(["verified", "pending"]),
  mappingCount: z.number().int().min(0),
});

const manualMappingSchema = z.object({
  namaste_code: z.string().trim().min(1, "NAMASTE code is required"),
  namaste_name: z.string().trim().min(1, "NAMASTE name is required"),
  icd11_code: z.string().trim().min(1, "ICD-11 code is required"),
  icd11_name: z.string().trim().min(1, "ICD-11 name is required"),
  category: categoryEnum,
  symptoms: z.union([z.array(z.string().trim().min(1)), z.string().trim()]).optional(),
  description: z.string().trim().min(1, "Description is required"),
  status: z.enum(["verified", "pending"]),
});

const importRowSchema = manualMappingSchema.extend({
  mappingCount: z.number().int().min(0).optional(),
  confidence: z.number().min(0).max(100).optional(),
});

const importRequestSchema = z.object({
  rows: z.array(importRowSchema).min(1, "At least one row is required"),
});

function normalizeSymptoms(rawValue: string): string[] {
  return rawValue
    .split(",")
    .map((symptom) => symptom.trim())
    .filter((symptom) => symptom.length > 0);
}

function normalizeCategory(value: string): NamasteCategory {
  return categoryEnum.parse(value);
}

function buildIcdChapter(category: NamasteCategory): string {
  switch (category) {
    case "Ayurveda":
      return "Traditional medicine mappings";
    case "Siddha":
      return "Traditional medicine mappings";
    case "Unani":
      return "Traditional medicine mappings";
    default:
      return "Traditional medicine mappings";
  }
}

function computeConfidenceFromStatus(status: "verified" | "pending"): number {
  return status === "verified" ? 82 : 64;
}

async function buildConsolidatedMappings() {
  const [namasteCodes, icd11Codes, mappings] = await Promise.all([
    NamasteCodeModel.find().lean().exec(),
    ICD11CodeModel.find().lean().exec(),
    CodeMappingModel.find().sort({ updatedAt: -1, createdAt: -1 }).lean().exec(),
  ]);

  const namasteByCode = new Map(namasteCodes.map((record) => [record.code, record]));
  const icd11ByCode = new Map(icd11Codes.map((record) => [record.code, record]));

  return mappings.map((mapping) => {
    const namaste = namasteByCode.get(mapping.namaste_code);
    const icd11 = icd11ByCode.get(mapping.icd11_code);

    return {
      id: mapping.namaste_code,
      namaste_code: mapping.namaste_code,
      namaste_name: namaste?.name ?? "",
      icd11_code: mapping.icd11_code,
      icd11_name: icd11?.name ?? "",
      category: namaste?.category ?? "Ayurveda",
      symptoms: namaste?.symptoms?.join(", ") ?? "",
      description: namaste?.description ?? icd11?.description ?? "",
      status: mapping.status,
      confidence: mapping.confidence,
      mappingCount: mapping.mappingCount,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  });
}

async function upsertManualMapping(input: z.infer<typeof manualMappingSchema> & {
  mappingCount?: number;
  confidence?: number;
  original_namaste_code?: string;
}) {
  const normalizedSymptoms = Array.isArray(input.symptoms)
    ? input.symptoms
    : normalizeSymptoms(String(input.symptoms ?? ""));
  const originalCode = input.original_namaste_code ?? input.namaste_code;
  const confidence = input.confidence ?? computeConfidenceFromStatus(input.status);
  const mappingCount = input.mappingCount ?? 1;

  await NamasteCodeModel.findOneAndUpdate(
    { code: originalCode },
    {
      code: input.namaste_code,
      name: input.namaste_name,
      description: input.description,
      category: input.category,
      symptoms: normalizedSymptoms,
      createdAt: new Date(),
    },
    { upsert: true, new: true },
  ).exec();

  await ICD11CodeModel.findOneAndUpdate(
    { code: input.icd11_code },
    {
      code: input.icd11_code,
      name: input.icd11_name,
      description: input.description,
      chapter: buildIcdChapter(input.category),
      createdAt: new Date(),
    },
    { upsert: true, new: true },
  ).exec();

  if (originalCode !== input.namaste_code) {
    await CodeMappingModel.deleteMany({ namaste_code: originalCode }).exec();
  }

  await CodeMappingModel.findOneAndUpdate(
    { namaste_code: input.namaste_code },
    {
      namaste_code: input.namaste_code,
      icd11_code: input.icd11_code,
      confidence,
      status: input.status,
      mappingCount,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true },
  ).exec();
}

router.post("/map-code", async (req, res) => {
  try {
    const input = requestSchema.parse(req.body);
    const response = await runCodeMappingAgent(input);
    return res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Agent route error:", error);
    return res.status(500).json({ error: "Failed to run code mapping agent" });
  }
});

router.get("/mappings", async (_req, res) => {
  try {
    const records = await buildConsolidatedMappings();
    return res.json(records);
  } catch (error) {
    console.error("Fetch mappings error:", error);
    return res.status(500).json({ error: "Failed to fetch mappings" });
  }
});

router.get("/export-mappings", async (_req, res) => {
  try {
    const records = await buildConsolidatedMappings();
    return res.json(records);
  } catch (error) {
    console.error("Export mappings error:", error);
    return res.status(500).json({ error: "Failed to export mappings" });
  }
});

router.post("/manual-mapping", async (req, res) => {
  try {
    const parsed = manualMappingSchema.parse({
      ...req.body,
      category: normalizeCategory(req.body.category),
    });

    await upsertManualMapping(parsed);
    return res.status(201).json({ message: "Mapping saved" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Manual mapping error:", error);
    return res.status(500).json({ error: "Failed to save mapping" });
  }
});

router.post("/import-mappings", async (req, res) => {
  try {
    const parsed = importRequestSchema.parse({
      rows: (req.body.rows as unknown[]).map((row) => ({
        ...(row as Record<string, unknown>),
        category: normalizeCategory(String((row as Record<string, unknown>).category ?? "Ayurveda")),
        status:
          String((row as Record<string, unknown>).status ?? "pending").toLowerCase() === "verified"
            ? "verified"
            : "pending",
        confidence: Number((row as Record<string, unknown>).confidence ?? 0) || undefined,
        mappingCount: Number((row as Record<string, unknown>).mappingCount ?? 1) || 1,
      })),
    });

    for (const row of parsed.rows) {
      await upsertManualMapping(row);
    }

    return res.json({ inserted: parsed.rows.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Import mappings error:", error);
    return res.status(500).json({ error: "Failed to import mappings" });
  }
});

router.post("/namaste-code", async (req, res) => {
  try {
    const parsed = namasteCodeSchema.parse({
      ...req.body,
      category: normalizeCategory(req.body.category),
      symptoms: Array.isArray(req.body.symptoms)
        ? req.body.symptoms
        : normalizeSymptoms(String(req.body.symptoms ?? "")),
    });

    const created = await NamasteCodeModel.create(parsed);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Create NAMASTE code error:", error);
    return res.status(500).json({ error: "Failed to create NAMASTE code" });
  }
});

router.post("/icd11-code", async (req, res) => {
  try {
    const parsed = icd11CodeSchema.parse(req.body);
    const created = await ICD11CodeModel.create(parsed);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Create ICD-11 code error:", error);
    return res.status(500).json({ error: "Failed to create ICD-11 code" });
  }
});

router.post("/mapping", async (req, res) => {
  try {
    const parsed = codeMappingSchema.parse({
      ...req.body,
      confidence: Number(req.body.confidence),
      mappingCount: Number(req.body.mappingCount),
    });

    const created = await CodeMappingModel.create(parsed);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Create code mapping error:", error);
    return res.status(500).json({ error: "Failed to create code mapping" });
  }
});

router.put("/mapping/:namasteCode", async (req, res) => {
  try {
    const parsed = manualMappingSchema.parse({
      ...req.body,
      category: normalizeCategory(req.body.category),
    });

    await upsertManualMapping({
      ...parsed,
      original_namaste_code: req.params.namasteCode,
    });

    return res.json({ message: "Mapping updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        fieldErrors: error.flatten().fieldErrors,
      });
    }

    console.error("Update mapping error:", error);
    return res.status(500).json({ error: "Failed to update mapping" });
  }
});

router.delete("/mapping/:namasteCode", async (req, res) => {
  try {
    const namasteCode = req.params.namasteCode;
    const mapping = await CodeMappingModel.findOne({ namaste_code: namasteCode }).lean().exec();

    await Promise.all([
      CodeMappingModel.deleteMany({ namaste_code: namasteCode }).exec(),
      NamasteCodeModel.deleteMany({ code: namasteCode }).exec(),
      mapping ? ICD11CodeModel.deleteMany({ code: mapping.icd11_code }).exec() : Promise.resolve(),
    ]);

    return res.json({ message: "Mapping deleted" });
  } catch (error) {
    console.error("Delete mapping error:", error);
    return res.status(500).json({ error: "Failed to delete mapping" });
  }
});

export default router;
