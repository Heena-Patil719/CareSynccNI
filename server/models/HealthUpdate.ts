import mongoose from "mongoose";
import type { Model } from "mongoose";

export interface HealthUpdate {
  patientId: string;
  bloodPressure?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

type HealthUpdateModel = Model<HealthUpdate>;

const { Schema, model, models } = mongoose;

const healthUpdateSchema = new Schema<HealthUpdate, HealthUpdateModel>(
  {
    patientId: { type: String, required: true, index: true, trim: true },
    bloodPressure: { type: Number },
    heartRate: { type: Number },
    temperature: { type: Number },
    oxygenSaturation: { type: Number },
    weight: { type: Number },
    notes: { type: String, trim: true },
    recordedBy: { type: String, required: true, trim: true },
    recordedAt: { type: Date, required: true, index: true },
  },
  {
    versionKey: false,
  },
);

const existingHealthUpdateModel = models.HealthUpdate as HealthUpdateModel | undefined;
if (existingHealthUpdateModel) {
  mongoose.deleteModel("HealthUpdate");
}

const HealthUpdateModel = model<HealthUpdate, HealthUpdateModel>("HealthUpdate", healthUpdateSchema, "healthupdates");

export default HealthUpdateModel;
