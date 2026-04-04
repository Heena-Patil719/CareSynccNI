import mongoose from "mongoose";
import type { Model } from "mongoose";
import { connectToMongo as connectWithBaseHelper } from "./mongo";

export const namasteCategories = ["Ayurveda", "Siddha", "Unani"] as const;
export type NamasteCategory = (typeof namasteCategories)[number];

export interface NamasteCodeDocument {
  code: string;
  name: string;
  description: string;
  category: NamasteCategory;
  symptoms: string[];
  createdAt: Date;
}

export interface ICD11CodeDocument {
  code: string;
  name: string;
  description: string;
  chapter: string;
  createdAt: Date;
}

export interface CodeMappingDocument {
  namaste_code: string;
  icd11_code: string;
  confidence: number;
  status: "verified" | "pending";
  mappingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const { Schema, model, models } = mongoose;

const namasteCodeSchema = new Schema<NamasteCodeDocument>(
  {
    code: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: namasteCategories, required: true, index: true },
    symptoms: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

namasteCodeSchema.index({
  code: "text",
  name: "text",
  description: "text",
  symptoms: "text",
});

const icd11CodeSchema = new Schema<ICD11CodeDocument>(
  {
    code: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const codeMappingSchema = new Schema<CodeMappingDocument>(
  {
    namaste_code: { type: String, required: true, index: true, trim: true },
    icd11_code: { type: String, required: true, index: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, enum: ["verified", "pending"], required: true },
    mappingCount: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

codeMappingSchema.pre("save", async function updateTimestamp() {
  this.updatedAt = new Date();
});

export const NamasteCodeModel =
  (models.NamasteCode as Model<NamasteCodeDocument> | undefined) ??
  model<NamasteCodeDocument>("NamasteCode", namasteCodeSchema, "namaste_codes");

export const ICD11CodeModel =
  (models.ICD11Code as Model<ICD11CodeDocument> | undefined) ??
  model<ICD11CodeDocument>("ICD11Code", icd11CodeSchema, "icd11_codes");

export const CodeMappingModel =
  (models.CodeMapping as Model<CodeMappingDocument> | undefined) ??
  model<CodeMappingDocument>("CodeMapping", codeMappingSchema, "code_mappings");

export async function connectToMongo() {
  await connectWithBaseHelper();
  return mongoose;
}
