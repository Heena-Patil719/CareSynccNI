import { RequestHandler } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb, toObjectId } from "../utils/mongo";

type PatientDocument = {
  _id: ObjectId;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | null;
  admitDate?: string | null;
  diagnosis?: string | null;
  email?: string | null;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
  createdAt: Date;
};

type DiagnosisDocument = {
  _id: ObjectId;
  patientId: ObjectId;
  namasteCode: string;
  icd11Code: string;
  symptoms?: string | null;
  clinicalNotes?: string | null;
  createdAt: Date;
};

const createPatientSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  admitDate: z.string().optional(),
  diagnosis: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
});

const addDiagnosisSchema = z.object({
  namasteCode: z.string().min(1),
  icd11Code: z.string().min(1),
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

function patientProjection(patient: PatientDocument, diagnosisCount = 0) {
  return {
    id: patient._id.toString(),
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth ?? undefined,
    gender: patient.gender ?? undefined,
    admitDate: patient.admitDate ?? undefined,
    diagnosis: patient.diagnosis ?? undefined,
    email: patient.email ?? undefined,
    phone: patient.phone ?? undefined,
    guardianName: patient.guardianName ?? undefined,
    guardianPhone: patient.guardianPhone ?? undefined,
    address: patient.address ?? undefined,
    diagnosisCount,
    createdAt: patient.createdAt.toISOString(),
  };
}

function diagnosisProjection(diagnosis: DiagnosisDocument) {
  return {
    id: diagnosis._id.toString(),
    namasteCode: diagnosis.namasteCode,
    icd11Code: diagnosis.icd11Code,
    symptoms: diagnosis.symptoms ?? undefined,
    clinicalNotes: diagnosis.clinicalNotes ?? undefined,
    recordedAt: diagnosis.createdAt.toISOString(),
  };
}

async function getCollections() {
  const db = await getDb();
  return {
    patients: db.collection<PatientDocument>("patients"),
    diagnoses: db.collection<DiagnosisDocument>("patientDiagnoses"),
  };
}

export const handleCreatePatient: RequestHandler = async (req, res) => {
  try {
    const data = createPatientSchema.parse(req.body);
    const { patients } = await getCollections();

    const duplicateQuery: Record<string, unknown> = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    };

    if (data.dateOfBirth) {
      duplicateQuery.dateOfBirth = data.dateOfBirth;
    }

    const duplicate = await patients.findOne(duplicateQuery);
    if (duplicate) {
      return res.status(409).json({ error: "A patient with the same name and date of birth already exists." });
    }

    if (data.email) {
      const existingEmail = await patients.findOne({ email: data.email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ error: "This email address is already used by another patient." });
      }
    }

    const patientDoc = {
      userId: data.userId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      admitDate: data.admitDate || null,
      diagnosis: data.diagnosis || null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      phone: data.phone || null,
      guardianName: data.guardianName || null,
      guardianPhone: data.guardianPhone || null,
      address: data.address || null,
      createdAt: new Date(),
    };

    const result = await patients.insertOne(patientDoc as any);
    const createdPatient = await patients.findOne({ _id: result.insertedId });

    if (!createdPatient) {
      return res.status(500).json({ error: "Failed to create patient" });
    }

    return res.status(201).json({ patient: patientProjection(createdPatient, 0) });
  } catch (error) {
    console.error("CREATE PATIENT ERROR:", error);
    return res.status(400).json({ error: "Invalid patient data" });
  }
};

export const handleGetPatient: RequestHandler = async (req, res) => {
  try {
    const patientId = toObjectId(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const { patients, diagnoses } = await getCollections();
    const patient = await patients.findOne({ _id: patientId });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const diagnosisDocs = await diagnoses.find({ patientId }).sort({ createdAt: 1 }).toArray();

    return res.json({
      patient: patientProjection(patient, diagnosisDocs.length),
      diagnoses: diagnosisDocs.map(diagnosisProjection),
    });
  } catch (error) {
    console.error("GET PATIENT ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleListPatients: RequestHandler = async (_req, res) => {
  try {
    const { patients, diagnoses } = await getCollections();
    const patientDocs = await patients.find({}).sort({ createdAt: -1 }).toArray();

    const counts = await diagnoses
      .aggregate<{ _id: ObjectId; count: number }>([
        { $group: { _id: "$patientId", count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

    return res.json({
      patients: patientDocs.map((patient) =>
        patientProjection(patient, countMap.get(patient._id.toString()) ?? 0),
      ),
      total: patientDocs.length,
    });
  } catch (error) {
    console.error("LIST PATIENTS ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAddDiagnosis: RequestHandler = async (req, res) => {
  try {
    const patientId = toObjectId(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const data = addDiagnosisSchema.parse(req.body);
    const { patients, diagnoses } = await getCollections();
    const patient = await patients.findOne({ _id: patientId });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const diagnosisDoc = {
      patientId,
      namasteCode: data.namasteCode.trim(),
      icd11Code: data.icd11Code.trim(),
      symptoms: data.symptoms || null,
      clinicalNotes: data.clinicalNotes || null,
      createdAt: new Date(),
    };

    const result = await diagnoses.insertOne(diagnosisDoc as any);
    const createdDiagnosis = await diagnoses.findOne({ _id: result.insertedId });

    if (!createdDiagnosis) {
      return res.status(500).json({ error: "Failed to add diagnosis" });
    }

    return res.status(201).json({ diagnosis: diagnosisProjection(createdDiagnosis) });
  } catch (error) {
    console.error("ADD DIAGNOSIS ERROR:", error);
    return res.status(400).json({ error: "Invalid diagnosis data" });
  }
};

export const handleDeletePatient: RequestHandler = async (req, res) => {
  try {
    const patientId = toObjectId(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const { patients, diagnoses } = await getCollections();
    await diagnoses.deleteMany({ patientId });
    const result = await patients.deleteOne({ _id: patientId });

    if (!result.deletedCount) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE PATIENT ERROR:", error);
    return res.status(500).json({ error: "Failed to delete patient" });
  }
};

export const handleDeleteDiagnosis: RequestHandler = async (req, res) => {
  try {
    const diagnosisId = toObjectId(req.params.diagnosisId);
    if (!diagnosisId) {
      return res.status(400).json({ error: "Invalid diagnosis id" });
    }

    const { diagnoses } = await getCollections();
    const result = await diagnoses.deleteOne({ _id: diagnosisId });

    if (!result.deletedCount) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE DIAGNOSIS ERROR:", error);
    return res.status(500).json({ error: "Failed to delete diagnosis" });
  }
};

export const handleExportPatientFHIR: RequestHandler = async (req, res) => {
  try {
    const patientId = toObjectId(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const { patients, diagnoses } = await getCollections();
    const patient = await patients.findOne({ _id: patientId });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const diagnosisDocs = await diagnoses.find({ patientId }).sort({ createdAt: 1 }).toArray();

    const bundle = {
      resourceType: "Bundle",
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: patient._id.toString(),
            name: [
              {
                use: "official",
                given: [patient.firstName],
                family: patient.lastName,
              },
            ],
            birthDate: patient.dateOfBirth ?? undefined,
            gender: patient.gender ?? undefined,
            telecom: [
              patient.email ? { system: "email", value: patient.email } : null,
              patient.phone ? { system: "phone", value: patient.phone } : null,
            ].filter(Boolean),
            address: patient.address ? [{ text: patient.address }] : undefined,
          },
        },
        ...diagnosisDocs.map((diagnosis) => ({
          resource: {
            resourceType: "Condition",
            id: diagnosis._id.toString(),
            code: {
              coding: [
                {
                  system: "http://id.who.int/icd/release/11/mms",
                  code: diagnosis.icd11Code,
                },
              ],
            },
            subject: {
              reference: `Patient/${patient._id.toString()}`,
            },
            recordedDate: diagnosis.createdAt.toISOString(),
            note: [
              ...(diagnosis.symptoms ? [{ text: `Symptoms: ${diagnosis.symptoms}` }] : []),
              ...(diagnosis.clinicalNotes ? [{ text: diagnosis.clinicalNotes }] : []),
            ],
          },
        })),
      ],
    };

    return res.json(bundle);
  } catch (error) {
    console.error("EXPORT FHIR ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
