import "dotenv/config";
import mongoose from "mongoose";
import {
  CodeMappingModel,
  ICD11CodeModel,
  NamasteCodeModel,
  connectToMongo,
  type CodeMappingDocument,
  type ICD11CodeDocument,
  type NamasteCategory,
  type NamasteCodeDocument,
} from "../lib/mongodb";

type SeedRecord = {
  suffix: string;
  category: NamasteCategory;
  namasteName: string;
  namasteDescription: string;
  symptoms: string[];
  icd11Code: string;
  icd11Name: string;
  icd11Description: string;
  chapter: string;
  confidence: number;
  status: CodeMappingDocument["status"];
  mappingCount: number;
};

const seedBaseRecords: SeedRecord[] = [
  {
    suffix: "001",
    category: "Ayurveda",
    namasteName: "Jwara",
    namasteDescription: "Fever pattern with chills, body ache, and heat sensation.",
    symptoms: ["fever", "cold", "chills", "body pain"],
    icd11Code: "1A00",
    icd11Name: "Influenza",
    icd11Description: "Acute viral respiratory illness with fever and systemic symptoms.",
    chapter: "Certain infectious or parasitic diseases",
    confidence: 86,
    status: "verified",
    mappingCount: 18,
  },
  {
    suffix: "002",
    category: "Ayurveda",
    namasteName: "Kasa",
    namasteDescription: "Persistent cough with throat irritation and chest discomfort.",
    symptoms: ["cough", "throat irritation", "chest pain"],
    icd11Code: "CA40",
    icd11Name: "Acute bronchitis",
    icd11Description: "Inflammation of the bronchi with cough and mucus production.",
    chapter: "Diseases of the respiratory system",
    confidence: 81,
    status: "verified",
    mappingCount: 14,
  },
  {
    suffix: "003",
    category: "Ayurveda",
    namasteName: "Amlapitta",
    namasteDescription: "Acid reflux pattern with sour belching and burning sensation.",
    symptoms: ["acidity", "heartburn", "burning", "belching"],
    icd11Code: "DA64",
    icd11Name: "Gastro-oesophageal reflux disease",
    icd11Description: "Reflux of stomach contents causing heartburn and regurgitation.",
    chapter: "Diseases of the digestive system",
    confidence: 90,
    status: "verified",
    mappingCount: 24,
  },
  {
    suffix: "004",
    category: "Ayurveda",
    namasteName: "Ardhavabhedaka",
    namasteDescription: "Unilateral severe headache often linked with light sensitivity.",
    symptoms: ["headache", "migraine", "eye pain", "light sensitivity"],
    icd11Code: "8A80",
    icd11Name: "Migraine",
    icd11Description: "Primary headache disorder with episodic throbbing pain.",
    chapter: "Diseases of the nervous system",
    confidence: 88,
    status: "verified",
    mappingCount: 16,
  },
  {
    suffix: "005",
    category: "Ayurveda",
    namasteName: "Atisara",
    namasteDescription: "Loose motions with abdominal cramps and dehydration tendency.",
    symptoms: ["diarrhea", "loose stools", "abdominal cramps"],
    icd11Code: "DA2Z",
    icd11Name: "Noninfective gastroenteritis or colitis, unspecified",
    icd11Description: "Inflammatory or irritative intestinal condition causing diarrhea.",
    chapter: "Diseases of the digestive system",
    confidence: 79,
    status: "verified",
    mappingCount: 12,
  },
  {
    suffix: "006",
    category: "Ayurveda",
    namasteName: "Pratishyaya",
    namasteDescription: "Nasal congestion with sneezing and watery discharge.",
    symptoms: ["cold", "runny nose", "sneezing", "nasal congestion"],
    icd11Code: "CA00",
    icd11Name: "Acute nasopharyngitis",
    icd11Description: "Common cold with congestion, sneezing, and mild fever.",
    chapter: "Diseases of the respiratory system",
    confidence: 84,
    status: "verified",
    mappingCount: 17,
  },
  {
    suffix: "007",
    category: "Ayurveda",
    namasteName: "Sandhivata",
    namasteDescription: "Joint pain with stiffness aggravated by movement and age.",
    symptoms: ["joint pain", "stiffness", "knee pain"],
    icd11Code: "FA01",
    icd11Name: "Osteoarthritis",
    icd11Description: "Degenerative joint disease causing pain and reduced function.",
    chapter: "Diseases of the musculoskeletal system or connective tissue",
    confidence: 85,
    status: "verified",
    mappingCount: 20,
  },
  {
    suffix: "008",
    category: "Ayurveda",
    namasteName: "Tamaka Shwasa",
    namasteDescription: "Breathlessness with wheezing and episodic chest tightness.",
    symptoms: ["breathlessness", "wheezing", "chest tightness"],
    icd11Code: "CA23",
    icd11Name: "Asthma",
    icd11Description: "Chronic inflammatory airway disease causing episodic wheeze.",
    chapter: "Diseases of the respiratory system",
    confidence: 91,
    status: "verified",
    mappingCount: 19,
  },
  {
    suffix: "009",
    category: "Ayurveda",
    namasteName: "Madhumeha",
    namasteDescription: "Frequent urination, thirst, and weight changes suggesting diabetes.",
    symptoms: ["polyuria", "thirst", "fatigue", "weight loss"],
    icd11Code: "5A11",
    icd11Name: "Type 2 diabetes mellitus",
    icd11Description: "Chronic hyperglycaemia due to insulin resistance or impaired secretion.",
    chapter: "Endocrine, nutritional or metabolic diseases",
    confidence: 93,
    status: "verified",
    mappingCount: 28,
  },
  {
    suffix: "010",
    category: "Ayurveda",
    namasteName: "Anidra",
    namasteDescription: "Difficulty falling asleep with daytime fatigue and irritability.",
    symptoms: ["insomnia", "sleep loss", "fatigue"],
    icd11Code: "7A00",
    icd11Name: "Insomnia disorder",
    icd11Description: "Persistent difficulty initiating or maintaining sleep.",
    chapter: "Sleep-wake disorders",
    confidence: 77,
    status: "pending",
    mappingCount: 7,
  },
];

function buildSeedRecords(targetCount: number): SeedRecord[] {
  const records: SeedRecord[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const base = seedBaseRecords[index % seedBaseRecords.length];
    const numericSuffix = String(index + 1).padStart(3, "0");

    records.push({
      ...base,
      suffix: numericSuffix,
      namasteName: `${base.namasteName} Variant ${index + 1}`,
      namasteDescription: `${base.namasteDescription} Seed profile ${index + 1}.`,
      symptoms: [...base.symptoms, `seed-symptom-${index + 1}`],
      icd11Code: `${base.icd11Code}${index < 10 ? "" : String(index % 9)}`,
      icd11Name: `${base.icd11Name} Variant ${index + 1}`,
      icd11Description: `${base.icd11Description} Seed profile ${index + 1}.`,
      confidence: Math.max(55, Math.min(98, base.confidence - (index % 6) + 2)),
      mappingCount: base.mappingCount + (index % 11),
      status: index % 4 === 0 ? "pending" : base.status,
    });
  }

  return records;
}

function buildNamasteDocuments(records: SeedRecord[]): NamasteCodeDocument[] {
  return records.map((record) => ({
    code: `${record.category.slice(0, 3).toUpperCase()}-${record.suffix}`,
    name: record.namasteName,
    description: record.namasteDescription,
    category: record.category,
    symptoms: record.symptoms,
    createdAt: new Date(),
  }));
}

function buildIcd11Documents(records: SeedRecord[]): ICD11CodeDocument[] {
  return records.map((record) => ({
    code: record.icd11Code,
    name: record.icd11Name,
    description: record.icd11Description,
    chapter: record.chapter,
    createdAt: new Date(),
  }));
}

function buildMappingDocuments(records: SeedRecord[]): CodeMappingDocument[] {
  return records.map((record) => ({
    namaste_code: `${record.category.slice(0, 3).toUpperCase()}-${record.suffix}`,
    icd11_code: record.icd11Code,
    confidence: record.confidence,
    status: record.status,
    mappingCount: record.mappingCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function upsertNamasteCodes(documents: NamasteCodeDocument[]) {
  await NamasteCodeModel.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { code: document.code },
        update: { $set: document },
        upsert: true,
      },
    })),
  );
}

async function upsertIcd11Codes(documents: ICD11CodeDocument[]) {
  await ICD11CodeModel.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { code: document.code },
        update: { $set: document },
        upsert: true,
      },
    })),
  );
}

async function upsertMappings(documents: CodeMappingDocument[]) {
  await CodeMappingModel.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: {
          namaste_code: document.namaste_code,
          icd11_code: document.icd11_code,
        },
        update: { $set: document },
        upsert: true,
      },
    })),
  );
}

async function seedMongoCodes() {
  console.log("Seeding MongoDB with starter code data...");
  await connectToMongo();

  const records = buildSeedRecords(50);
  const namasteCodes = buildNamasteDocuments(records);
  const icd11Codes = buildIcd11Documents(records);
  const mappings = buildMappingDocuments(records);

  await upsertNamasteCodes(namasteCodes);
  await upsertIcd11Codes(icd11Codes);
  await upsertMappings(mappings);

  console.log(`Inserted or updated ${namasteCodes.length} NAMASTE codes`);
  console.log(`Inserted or updated ${icd11Codes.length} ICD-11 codes`);
  console.log(`Inserted or updated ${mappings.length} code mappings`);
}

seedMongoCodes()
  .catch((error) => {
    console.error("Mongo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
