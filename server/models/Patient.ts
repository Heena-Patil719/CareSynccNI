import mongoose from "mongoose";
import type { Model } from "mongoose";

export const patientGenders = ["Male", "Female", "Other"] as const;
export type PatientGender = (typeof patientGenders)[number];

export const patientStatuses = ["admitted", "discharged", "critical", "stable", "under observation"] as const;
export type PatientStatus = (typeof patientStatuses)[number];

export interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: PatientGender;
  bloodGroup: string;
  contact: {
    phone: string;
    email?: string;
    emergencyContact: {
      name: string;
      relation: string;
      phone: string;
    };
  };
  address: string;
  ward: string;
  bedNumber: string;
  admittedAt: Date;
  dischargedAt?: Date;
  status: PatientStatus;
  assignedDoctor: string;
  diagnosis: string;
  namasteCode?: string;
  icd11Code?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

type PatientModel = Model<Patient>;

const { Schema, model, models } = mongoose;

const patientSchema = new Schema<Patient, PatientModel>(
  {
    patientId: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: patientGenders, required: true },
    bloodGroup: { type: String, required: true, trim: true },
    contact: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      emergencyContact: {
        name: { type: String, required: true, trim: true },
        relation: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
      },
    },
    address: { type: String, required: true, trim: true },
    ward: { type: String, required: true, index: true, trim: true },
    bedNumber: { type: String, required: true, trim: true },
    admittedAt: { type: Date, required: true },
    dischargedAt: { type: Date },
    status: { type: String, enum: patientStatuses, required: true, index: true },
    assignedDoctor: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    namasteCode: { type: String, trim: true },
    icd11Code: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const existingPatientModel = models.Patient as PatientModel | undefined;
// If the schema was fundamentally different, we might need to delete it to avoid OverwriteModelError in hot-reload
if (existingPatientModel) {
  mongoose.deleteModel("Patient");
}

const PatientModel = model<Patient, PatientModel>("Patient", patientSchema, "patients");

export default PatientModel;
