import { Router } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb, toObjectId } from "../utils/mongo";

const router = Router();

type CodemapDocument = {
  _id: ObjectId;
  namaste_code: string;
  namaste_name?: string | null;
  icd11_code: string;
  icd11_name?: string | null;
  category: string;
  symptoms?: string | null;
  description?: string | null;
  status: string;
  created_at: Date;
};

const codemapSchema = z.object({
  namaste_code: z.string().min(1),
  namaste_name: z.string().optional().nullable(),
  icd11_code: z.string().min(1),
  icd11_name: z.string().optional().nullable(),
  category: z.string().min(1),
  symptoms: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().min(1),
});

const bulkCodemapSchema = z.array(codemapSchema);

function normalizeCodemap(input: z.infer<typeof codemapSchema>) {
  return {
    namaste_code: input.namaste_code.trim(),
    namaste_name: input.namaste_name?.trim() || null,
    icd11_code: input.icd11_code.trim(),
    icd11_name: input.icd11_name?.trim() || null,
    category: input.category.trim(),
    symptoms: input.symptoms?.trim() || null,
    description: input.description?.trim() || null,
    status: input.status.trim().toLowerCase(),
  };
}

function mapCodemap(doc: CodemapDocument) {
  return {
    id: doc._id.toString(),
    namaste_code: doc.namaste_code,
    namaste_name: doc.namaste_name ?? "",
    icd11_code: doc.icd11_code,
    icd11_name: doc.icd11_name ?? "",
    category: doc.category,
    symptoms: doc.symptoms ?? "",
    description: doc.description ?? "",
    status: doc.status,
    created_at: doc.created_at.toISOString(),
  };
}

async function getCollection() {
  const db = await getDb();
  return db.collection<CodemapDocument>("codemap");
}

router.get("/", async (_req, res) => {
  try {
    const collection = await getCollection();
    const docs = await collection.find({}).sort({ created_at: -1 }).toArray();
    return res.json({ mappings: docs.map(mapCodemap) });
  } catch (error) {
    console.error("GET CODEMAP ERROR:", error);
    return res.status(500).json({ error: "Failed to load mappings" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = codemapSchema.parse(req.body);
    const payload = normalizeCodemap(parsed);
    const collection = await getCollection();

    const duplicate = await collection.findOne({
      namaste_code: payload.namaste_code,
      icd11_code: payload.icd11_code,
    });

    if (duplicate) {
      return res.status(409).json({ error: "Mapping already exists" });
    }

    const result = await collection.insertOne({
      ...payload,
      created_at: new Date(),
    } as any);

    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
      return res.status(500).json({ error: "Failed to create mapping" });
    }

    return res.status(201).json({ mapping: mapCodemap(created) });
  } catch (error) {
    console.error("CREATE CODEMAP ERROR:", error);
    return res.status(400).json({ error: "Invalid mapping data" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const parsed = bulkCodemapSchema.parse(req.body);
    const normalized = parsed.map(normalizeCodemap);
    const collection = await getCollection();

    const existing = await collection
      .find(
        {
          $or: normalized.map((item) => ({
            namaste_code: item.namaste_code,
            icd11_code: item.icd11_code,
          })),
        },
        { projection: { namaste_code: 1, icd11_code: 1 } },
      )
      .toArray();

    const existingKeys = new Set(
      existing.map((item) => `${item.namaste_code.toLowerCase()}||${item.icd11_code.toLowerCase()}`),
    );

    const uniqueRows = normalized.filter(
      (item) => !existingKeys.has(`${item.namaste_code.toLowerCase()}||${item.icd11_code.toLowerCase()}`),
    );

    if (!uniqueRows.length) {
      return res.json({ inserted: 0, skipped: normalized.length });
    }

    await collection.insertMany(
      uniqueRows.map((item) => ({
        ...item,
        created_at: new Date(),
      })) as any,
    );

    return res.json({
      inserted: uniqueRows.length,
      skipped: normalized.length - uniqueRows.length,
    });
  } catch (error) {
    console.error("BULK CODEMAP ERROR:", error);
    return res.status(400).json({ error: "Invalid bulk mapping data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid mapping id" });
    }

    const parsed = codemapSchema.extend({ id: z.string().optional() }).parse(req.body);
    const payload = normalizeCodemap(parsed);
    const collection = await getCollection();

    await collection.updateOne({ _id: objectId }, { $set: payload });
    const updated = await collection.findOne({ _id: objectId });

    if (!updated) {
      return res.status(404).json({ error: "Mapping not found" });
    }

    return res.json({ mapping: mapCodemap(updated) });
  } catch (error) {
    console.error("UPDATE CODEMAP ERROR:", error);
    return res.status(400).json({ error: "Failed to update mapping" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid mapping id" });
    }

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: objectId });

    if (!result.deletedCount) {
      return res.status(404).json({ error: "Mapping not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE CODEMAP ERROR:", error);
    return res.status(500).json({ error: "Failed to delete mapping" });
  }
});

export default router;
