// Demo endpoint
export interface DemoResponse {
  message: string;
}

// Code Search
export interface CodeSearchResult {
  namasteCode: string;
  namasteDescription: string;
  icd11Code: string;
  icd11Description: string;
  confidence: number;
  category: "Ayurveda" | "Siddha" | "Unani";
}

export interface CodeSearchResponse {
  results: CodeSearchResult[];
  total: number;
}

// Patient Management
export interface FHIRPatient {
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

export interface Diagnosis {
  code: string;
  icd11Code: string;
  description: string;
  recordedDate: string;
}

export interface PatientRecord {
  id: string;
  patient: FHIRPatient;
  diagnoses: Diagnosis[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
}

export interface AddDiagnosisRequest {
  code: string;
  icd11Code: string;
  description: string;
}

export interface FHIRBundle {
  resourceType: "Bundle";
  type: string;
  timestamp: string;
  entry: Array<{
    resource: unknown;
  }>;
}
