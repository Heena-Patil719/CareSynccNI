import type { RequestHandler } from "express";
import { z } from "zod";
import { runVitalsAlertAgent } from "../agents/vitalsAlertAgent";
import { connectToMongo } from "../lib/mongo";
import PatientModel from "../models/Patient";
import HealthUpdateModel from "../models/HealthUpdate";

const createPatientSchema = z.object({
  name: z.string().trim().min(1),
  age: z.number().positive(),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.string().trim(),
  contact: z.object({
    phone: z.string().trim(),
    email: z.string().email().optional(),
    emergencyContact: z.object({
      name: z.string().trim(),
      relation: z.string().trim(),
      phone: z.string().trim(),
    }),
  }),
  address: z.string().trim(),
  ward: z.string().trim(),
  bedNumber: z.string().trim(),
  admittedAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()),
  status: z.enum(["admitted", "discharged", "critical", "stable", "under observation"]),
  assignedDoctor: z.string().trim(),
  diagnosis: z.string().trim(),
  notes: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const addHealthUpdateSchema = z.object({
  bloodPressure: z.number().finite().optional(),
  heartRate: z.number().finite().optional(),
  temperature: z.number().finite().optional(),
  oxygenSaturation: z.number().finite().optional(),
  weight: z.number().finite().optional(),
  notes: z.string().trim().optional(),
  recordedBy: z.string().trim().min(1),
}).refine(
  (data) => data.bloodPressure !== undefined || data.heartRate !== undefined || data.temperature !== undefined || data.oxygenSaturation !== undefined || data.weight !== undefined,
  { message: "At least one vital is required" }
);

function getRequesterUserId(req: Parameters<RequestHandler>[0]): string | null {
  const headerValue = req.headers["x-user-id"];
  if (Array.isArray(headerValue)) return headerValue[0]?.trim() || null;
  return typeof headerValue === "string" && headerValue.trim() ? headerValue.trim() : null;
}

export const handleListPatients: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    
    const { ward, status, search } = req.query;
    const filter: any = {};
    if (ward) filter.ward = ward as string;
    if (status) filter.status = status as string;
    if (search) {
      filter.$or = [
        { name: { $regex: search as string, $options: "i" } },
        { patientId: { $regex: search as string, $options: "i" } }
      ];
    }
    
    // Try filtering by ownerId if needed based on auth
    // const ownerId = getRequesterUserId(req);
    // if (ownerId) filter.ownerId = ownerId;

    const patients = await PatientModel.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("LIST PATIENTS ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetPatient: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const patient = await PatientModel.findOne({ patientId: req.params.patientId });
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    res.json(patient);
  } catch (error) {
    console.error("GET PATIENT ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCreatePatient: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const data = createPatientSchema.parse(req.body);
    
    // auto-generate patientId as "PAT-XXXX"
    const count = await PatientModel.countDocuments();
    const patientId = `PAT-${String(count + 1).padStart(4, '0')}`;
    
    const patient = await PatientModel.create({
      ...data,
      patientId,
    });
    
    res.status(201).json(patient);
  } catch (error) {
    console.error("CREATE PATIENT ERROR:", error);
    res.status(400).json({ error: "Invalid patient data", details: error });
  }
};

export const handleUpdatePatient: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const data = updatePatientSchema.parse(req.body);
    const patient = await PatientModel.findOneAndUpdate(
      { patientId: req.params.patientId },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    
    res.json(patient);
  } catch (error) {
    console.error("UPDATE PATIENT ERROR:", error);
    res.status(400).json({ error: "Invalid update data", details: error });
  }
};

export const handleDeletePatient: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const deleted = await PatientModel.findOneAndDelete({ patientId: req.params.patientId });
    if (!deleted) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    // Optional: Delete related health updates
    await HealthUpdateModel.deleteMany({ patientId: req.params.patientId });
    
    res.status(204).send();
  } catch (error) {
    console.error("DELETE PATIENT ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetHealthUpdates: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const updates = await HealthUpdateModel.find({ patientId: req.params.patientId })
      .sort({ recordedAt: -1 });
    res.json(updates);
  } catch (error) {
    console.error("GET HEALTH UPDATES ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAddHealthUpdate: RequestHandler = async (req, res) => {
  try {
    await connectToMongo();
    const { patientId } = req.params;
    const data = addHealthUpdateSchema.parse(req.body);
    
    const patient = await PatientModel.findOne({ patientId });
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    
    const update = await HealthUpdateModel.create({
      patientId,
      ...data,
      recordedAt: new Date()
    });
    
    const pName = patient.name || `${(patient as any).firstName || ""} ${(patient as any).lastName || ""}`.trim() || "Unknown";
    // non-blocking invoke vitals alert agent
    runVitalsAlertAgent(patientId, {
      bloodPressure: data.bloodPressure,
      heartRate: data.heartRate,
      temperature: data.temperature,
      patientName: pName,
    }).catch(console.error);
    
    res.status(201).json(update);
  } catch (error) {
    console.error("ADD HEALTH UPDATE ERROR:", error);
    res.status(400).json({ error: "Invalid health update data", details: error });
  }
};
