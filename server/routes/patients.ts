import { RequestHandler } from "express";
import { z } from "zod";

interface FHIRPatient {
  resourceType: "Patient";
  id: string;
  name: Array<{
    use: string;
    given: string[];
    family: string;
  }>;
  birthDate?: string;
  gender?: string;
  contact?: Array<{
    system: string;
    value: string;
  }>;
}

interface Diagnosis {
  code: string;
  icd11Code: string;
  description: string;
  recordedDate: string;
}

interface PatientRecord {
  id: string;
  patient: FHIRPatient;
  diagnoses: Diagnosis[];
  createdAt: string;
  updatedAt: string;
}

// Mock patients database
const mockPatients: Map<string, PatientRecord> = new Map([
  [
    "P001",
    {
      id: "P001",
      patient: {
        resourceType: "Patient",
        id: "P001",
        name: [
          {
            use: "official",
            given: ["John"],
            family: "Doe",
          },
        ],
        birthDate: "1980-01-15",
        gender: "male",
      },
      diagnoses: [
        {
          code: "AYR-001",
          icd11Code: "BA25.1",
          description: "Vata Vyadhi (Wind Disorder)",
          recordedDate: "2024-01-10",
        },
      ],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-10",
    },
  ],
]);

const createPatientSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

const addDiagnosisSchema = z.object({
  code: z.string(),
  icd11Code: z.string(),
  description: z.string(),
});

export const handleCreatePatient: RequestHandler = (req, res) => {
  try {
    const data = createPatientSchema.parse(req.body);

    const id = `P${Date.now()}`;
    const patient: FHIRPatient = {
      resourceType: "Patient",
      id,
      name: [
        {
          use: "official",
          given: [data.firstName],
          family: data.lastName,
        },
      ],
      birthDate: data.birthDate,
      gender: data.gender,
    };

    const record: PatientRecord = {
      id,
      patient,
      diagnoses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPatients.set(id, record);

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: "Invalid patient data" });
  }
};

export const handleGetPatient: RequestHandler = (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = mockPatients.get(patientId);

    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleListPatients: RequestHandler = (_req, res) => {
  try {
    const patients = Array.from(mockPatients.values());
    res.json({ patients, total: patients.length });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAddDiagnosis: RequestHandler = (req, res) => {
  try {
    const { patientId } = req.params;
    const data = addDiagnosisSchema.parse(req.body);

    const patient = mockPatients.get(patientId);
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const diagnosis: Diagnosis = {
      ...data,
      recordedDate: new Date().toISOString().split("T")[0],
    };

    patient.diagnoses.push(diagnosis);
    patient.updatedAt = new Date().toISOString();

    mockPatients.set(patientId, patient);

    res.status(201).json(diagnosis);
  } catch (error) {
    res.status(400).json({ error: "Invalid diagnosis data" });
  }
};

export const handleExportPatientFHIR: RequestHandler = (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = mockPatients.get(patientId);

    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    // Create a FHIR Bundle with Patient and Condition resources
    const bundle = {
      resourceType: "Bundle",
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: patient.patient,
        },
        ...patient.diagnoses.map((diagnosis) => ({
          resource: {
            resourceType: "Condition",
            id: `C${Date.now()}`,
            code: {
              coding: [
                {
                  system: "http://id.who.int/icd/release/11/mms",
                  code: diagnosis.icd11Code,
                  display: diagnosis.description,
                },
              ],
            },
            subject: {
              reference: `Patient/${patient.id}`,
            },
            recordedDate: diagnosis.recordedDate,
          },
        })),
      ],
    };

    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
