import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  FileJson,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

interface Diagnosis {
  id: string;
  namasteCode: string;
  namasteDescription: string;
  icd11Code: string;
  icd11Description: string;
  recordedDate: string;
  notes?: string;
}

interface PatientDetailData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  diagnoses: Diagnosis[];
  createdAt: string;
}

// Mock data - in real app would fetch from API
const mockPatientData: Record<string, PatientDetailData> = {
  P001: {
    id: "P001",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1980-01-15",
    gender: "male",
    diagnoses: [
      {
        id: "D1",
        namasteCode: "AYR-001",
        namasteDescription: "Vata Vyadhi (Wind Disorder)",
        icd11Code: "BA25.1",
        icd11Description: "Disorders of the nervous system and sense organs",
        recordedDate: "2024-01-01",
        notes: "Patient presents with symptoms of nerve disorder",
      },
      {
        id: "D2",
        namasteCode: "SID-045",
        namasteDescription: "Pitta Roga (Pitta Disease)",
        icd11Code: "DA90",
        icd11Description: "Diabetes mellitus",
        recordedDate: "2024-01-10",
        notes: "Blood sugar levels elevated",
      },
    ],
    createdAt: "2024-01-01",
  },
  P002: {
    id: "P002",
    firstName: "Sarah",
    lastName: "Smith",
    dateOfBirth: "1992-06-22",
    gender: "female",
    diagnoses: [
      {
        id: "D3",
        namasteCode: "UNA-012",
        namasteDescription: "Humoral Imbalance",
        icd11Code: "QD82",
        icd11Description: "Symptoms and signs",
        recordedDate: "2024-01-05",
      },
    ],
    createdAt: "2024-01-05",
  },
  P003: {
    id: "P003",
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: "1975-03-10",
    gender: "male",
    diagnoses: [
      {
        id: "D4",
        namasteCode: "AYR-023",
        namasteDescription: "Kapha Vyadhi (Phlegm Disorder)",
        icd11Code: "DB20",
        icd11Description: "Asthma",
        recordedDate: "2024-01-08",
      },
      {
        id: "D5",
        namasteCode: "SID-089",
        namasteDescription: "Iyya Pitta (Bodily Humours)",
        icd11Code: "EA03",
        icd11Description: "Hypertension",
        recordedDate: "2024-01-12",
      },
      {
        id: "D6",
        namasteCode: "AYR-001",
        namasteDescription: "Vata Vyadhi (Wind Disorder)",
        icd11Code: "BA25.1",
        icd11Description: "Disorders of the nervous system and sense organs",
        recordedDate: "2024-01-15",
      },
    ],
    createdAt: "2024-01-08",
  },
};

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const patient = patientId ? mockPatientData[patientId] : null;

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(
    patient?.diagnoses || []
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    namasteCode: "",
    icd11Code: "",
    notes: "",
  });

  if (!patient) {
    return (
      <div className="space-y-4">
        <Link to="/patients">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </Button>
        </Link>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Patient not found</p>
        </div>
      </div>
    );
  }

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namasteCode || !formData.icd11Code) return;

    const newDiagnosis: Diagnosis = {
      id: `D${Date.now()}`,
      namasteCode: formData.namasteCode,
      namasteDescription: "Diagnosis", // Would fetch from real data
      icd11Code: formData.icd11Code,
      icd11Description: "ICD-11 Code", // Would fetch from real data
      recordedDate: new Date().toISOString().split("T")[0],
      notes: formData.notes,
    };

    setDiagnoses([...diagnoses, newDiagnosis]);
    setFormData({ namasteCode: "", icd11Code: "", notes: "" });
    setShowForm(false);
  };

  const handleDeleteDiagnosis = (id: string) => {
    setDiagnoses(diagnoses.filter((d) => d.id !== id));
  };

  const exportFHIR = () => {
    const fhirBundle = {
      resourceType: "Bundle",
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: patient.id,
            name: [
              {
                use: "official",
                given: [patient.firstName],
                family: patient.lastName,
              },
            ],
            birthDate: patient.dateOfBirth,
            gender: patient.gender,
          },
        },
        ...diagnoses.map((diagnosis) => ({
          resource: {
            resourceType: "Condition",
            id: diagnosis.id,
            code: {
              coding: [
                {
                  system: "http://id.who.int/icd/release/11/mms",
                  code: diagnosis.icd11Code,
                  display: diagnosis.icd11Description,
                },
              ],
            },
            subject: {
              reference: `Patient/${patient.id}`,
            },
            recordedDate: diagnosis.recordedDate,
            note: diagnosis.notes
              ? [{ text: diagnosis.notes }]
              : undefined,
          },
        })),
      ],
    };

    const dataStr = JSON.stringify(fhirBundle, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patient-${patient.id}-fhir.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/patients" className="text-sm text-primary hover:underline mb-2 inline-block">
              ← Back to Patients
            </Link>
            <h1 className="text-3xl font-display font-bold mb-2">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">
              Patient ID: {patient.id}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportFHIR} className="gap-2">
              <Download className="w-4 h-4" />
              Export FHIR JSON
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient.dateOfBirth && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Date of Birth
              </p>
              <p className="text-lg font-semibold">{patient.dateOfBirth}</p>
            </div>
          )}
          {patient.gender && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Gender
              </p>
              <p className="text-lg font-semibold capitalize">
                {patient.gender}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
              Total Diagnoses
            </p>
            <p className="text-lg font-semibold">{diagnoses.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
              Created
            </p>
            <p className="text-lg font-semibold">{patient.createdAt}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
              Last Updated
            </p>
            <p className="text-lg font-semibold">
              {diagnoses.length > 0
                ? diagnoses[diagnoses.length - 1].recordedDate
                : patient.createdAt}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
              Status
            </p>
            <p className="text-lg font-semibold text-green-600">Active</p>
          </div>
        </div>

        {/* Diagnoses Section */}
        <div className="space-y-4 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold">Diagnoses</h2>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
              size="sm"
              variant={showForm ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4" />
              {showForm ? "Cancel" : "Add Diagnosis"}
            </Button>
          </div>

          {/* Add Diagnosis Form */}
          {showForm && (
            <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
              <h3 className="font-semibold mb-4">New Diagnosis</h3>
              <form onSubmit={handleAddDiagnosis} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      NAMASTE Code *
                    </label>
                    <Input
                      placeholder="e.g., AYR-001"
                      value={formData.namasteCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          namasteCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      ICD-11 Code *
                    </label>
                    <Input
                      placeholder="e.g., BA25.1"
                      value={formData.icd11Code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          icd11Code: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Clinical Notes
                  </label>
                  <textarea
                    placeholder="Optional notes about this diagnosis..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Diagnosis</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Diagnoses List */}
          {diagnoses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No diagnoses recorded yet
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Diagnosis
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {diagnoses.map((diagnosis) => (
                <div
                  key={diagnosis.id}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
                            NAMASTE Code
                          </h4>
                          <p className="font-bold text-lg">
                            {diagnosis.namasteCode}
                          </p>
                          <p className="text-sm text-foreground">
                            {diagnosis.namasteDescription}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
                            ICD-11 Code
                          </h4>
                          <p className="font-bold text-lg">
                            {diagnosis.icd11Code}
                          </p>
                          <p className="text-sm text-foreground">
                            {diagnosis.icd11Description}
                          </p>
                        </div>
                      </div>

                      {diagnosis.notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
                            Notes
                          </h4>
                          <p className="text-sm">{diagnosis.notes}</p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {diagnosis.recordedDate}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDeleteDiagnosis(diagnosis.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History/Timeline */}
        {diagnoses.length > 0 && (
          <div className="space-y-4 border-t border-border pt-8">
            <h2 className="text-2xl font-display font-bold">History</h2>
            <div className="space-y-3">
              {[...diagnoses]
                .sort(
                  (a, b) =>
                    new Date(b.recordedDate).getTime() -
                    new Date(a.recordedDate).getTime()
                )
                .map((diagnosis, idx) => (
                  <div
                    key={diagnosis.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                      {diagnoses.length - idx}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {diagnosis.namasteCode} → {diagnosis.icd11Code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {diagnosis.namasteDescription}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {diagnosis.recordedDate}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
