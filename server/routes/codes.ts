import { RequestHandler } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb, toObjectId } from "../utils/mongo";

type CodemapDocument = {
  _id: ObjectId;
  namaste_code: string;
  namaste_name?: string | null;
  icd11_code: string;
  icd11_name?: string | null;
  category: "Ayurveda" | "Siddha" | "Unani";
  status?: string;
  created_at?: Date;
};

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["Ayurveda", "Siddha", "Unani"]).optional(),
  limit: z.coerce.number().default(10),
});

async function getCollection() {
  const db = await getDb();
  return db.collection<CodemapDocument>("codemap");
}

function mapCode(doc: CodemapDocument) {
  return {
    namasteCode: doc.namaste_code,
    namasteDescription: doc.namaste_name ?? "",
    icd11Code: doc.icd11_code,
    icd11Description: doc.icd11_name ?? "",
    confidence: 1,
    category: doc.category,
  };
}

export const handleSearchCodes: RequestHandler = async (req, res) => {
  try {
    const query = searchQuerySchema.parse(req.query);
    const collection = await getCollection();
    const filters: Record<string, unknown>[] = [];

    if (query.q) {
      const pattern = new RegExp(query.q, "i");
      filters.push({
        $or: [
          { namaste_code: pattern },
          { namaste_name: pattern },
          { icd11_code: pattern },
          { icd11_name: pattern },
        ],
      });
    }

    if (query.category) {
      filters.push({ category: query.category });
    }

    const docs = await collection
      .find(filters.length ? { $and: filters } : {})
      .limit(query.limit)
      .toArray();

    return res.json({
      results: docs.map(mapCode),
      total: docs.length,
    });
  } catch (error) {
    console.error("SEARCH CODES ERROR:", error);
    return res.status(400).json({ error: "Invalid search query" });
  }
};

export const handleGetCodeByNameste: RequestHandler = async (req, res) => {
  try {
    const collection = await getCollection();
    const doc = await collection.findOne({ namaste_code: req.params.code });

    if (!doc) {
      return res.status(404).json({ error: "Code not found" });
    }

    return res.json(mapCode(doc));
  } catch (error) {
    console.error("GET CODE ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
