import { RequestHandler } from "express";
import { z } from "zod";

interface CodeSearchResult {
  namasteCode: string;
  namasteDescription: string;
  icd11Code: string;
  icd11Description: string;
  confidence: number;
  category: "Ayurveda" | "Siddha" | "Unani";
}

interface CodeSearchResponse {
  results: CodeSearchResult[];
  total: number;
}

// Mock codes database
const mockCodes: CodeSearchResult[] = [
  {
    namasteCode: "AYR-001",
    namasteDescription: "Vata Vyadhi (Wind Disorder)",
    icd11Code: "BA25.1",
    icd11Description: "Disorders of the nervous system and sense organs",
    confidence: 0.94,
    category: "Ayurveda",
  },
  {
    namasteCode: "SID-045",
    namasteDescription: "Pitta Roga (Pitta Disease)",
    icd11Code: "DA90",
    icd11Description: "Diabetes mellitus",
    confidence: 0.87,
    category: "Siddha",
  },
  {
    namasteCode: "UNA-012",
    namasteDescription: "Humoral Imbalance",
    icd11Code: "QD82",
    icd11Description: "Symptoms and signs",
    confidence: 0.76,
    category: "Unani",
  },
  {
    namasteCode: "AYR-023",
    namasteDescription: "Kapha Vyadhi (Phlegm Disorder)",
    icd11Code: "DB20",
    icd11Description: "Asthma",
    confidence: 0.92,
    category: "Ayurveda",
  },
  {
    namasteCode: "SID-089",
    namasteDescription: "Iyya Pitta (Bodily Humours)",
    icd11Code: "EA03",
    icd11Description: "Hypertension",
    confidence: 0.65,
    category: "Siddha",
  },
];

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(["Ayurveda", "Siddha", "Unani"]).optional(),
  limit: z.coerce.number().default(10),
});

export const handleSearchCodes: RequestHandler = (req, res) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    let results = mockCodes;

    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      results = results.filter(
        (code) =>
          code.namasteCode.toLowerCase().includes(searchTerm) ||
          code.namasteDescription.toLowerCase().includes(searchTerm) ||
          code.icd11Code.toLowerCase().includes(searchTerm) ||
          code.icd11Description.toLowerCase().includes(searchTerm)
      );
    }

    if (query.category) {
      results = results.filter((code) => code.category === query.category);
    }

    results = results.slice(0, query.limit);

    const response: CodeSearchResponse = {
      results,
      total: results.length,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: "Invalid search query" });
  }
};

export const handleGetCodeByNameste: RequestHandler = (req, res) => {
  try {
    const { code } = req.params;
    const result = mockCodes.find((c) => c.namasteCode === code);

    if (!result) {
      res.status(404).json({ error: "Code not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
