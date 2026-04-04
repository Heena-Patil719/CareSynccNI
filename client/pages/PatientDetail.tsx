import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  admitDate?: string;
  email?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  createdAt: string;
}

interface Diagnosis {
  id: string;
  namasteCode: string;
  icd11Code: string;
  symptoms?: string;
  clinicalNotes?: string;
  recordedAt: string;
}

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export default function PatientDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    namasteCode: "",
    icd11Code: "",
    symptoms: "",
    clinicalNotes: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;

      setLoading(true);

      try {
        const res = await fetch(`/api/patients/${patientId}`);
        const data = await readJson(res);

        if (!res.ok) {
          throw new Error(data.error || "Failed to load patient");
        }

        setPatient(data.patient || null);
        setDiagnoses(data.diagnoses || []);
      } catch (error) {
        console.error("Patient load error:", error);
        setPatient(null);
        setDiagnoses([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [patientId]);

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !formData.namasteCode || !formData.icd11Code) return;

    try {
      const res = await fetch(`/api/patients/${patient.id}/diagnoses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to add diagnosis");
      }

      if (data.diagnosis) {
        setDiagnoses((prev) => [...prev, data.diagnosis]);
      }

      setFormData({
        namasteCode: "",
        icd11Code: "",
        symptoms: "",
        clinicalNotes: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Add diagnosis error:", error);
      alert("Failed to add diagnosis.");
    }
  };

  const handleDeleteDiagnosis = async (id: string) => {
    const ok = window.confirm("Delete this diagnosis?");
    if (!ok || !patient) return;

    try {
      const res = await fetch(`/api/patients/${patient.id}/diagnoses/${id}`, {
        method: "DELETE",
      });
      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete diagnosis");
      }

      setDiagnoses((prev) => prev.filter((diagnosis) => diagnosis.id !== id));
    } catch (error) {
      console.error("Delete diagnosis error:", error);
      alert("Failed to delete diagnosis.");
    }
  };

  const exportFHIR = async () => {
    if (!patient) return;

    try {
      const res = await fetch(`/api/patients/${patient.id}/fhir`);
      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to export FHIR");
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-${patient.id}-fhir.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("FHIR export error:", error);
      alert("Failed to export FHIR JSON.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 space-y-4">
        <Link to="/patients">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </Button>
        </Link>
        <p className="text-center text-muted-foreground">Patient not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link to="/patients" className="text-primary text-sm">
            ← Back to Patients
          </Link>
          <h1 className="text-3xl font-bold mt-2">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground text-sm">ID: {patient.id}</p>
          <p className="text-xs text-muted-foreground">Created: {patient.createdAt}</p>
        </div>

        <Button className="gap-2" onClick={exportFHIR}>
          <Download className="w-4 h-4" />
          Export FHIR JSON
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DetailCard label="Date of Birth" value={patient.dateOfBirth} />
        <DetailCard label="Gender" value={patient.gender} />
        <DetailCard label="Admit Date" value={patient.admitDate} />
        <DetailCard label="Email" value={patient.email} />
        <DetailCard label="Phone" value={patient.phone} />
        <DetailCard label="Guardian Name" value={patient.guardianName} />
        <DetailCard label="Guardian Phone" value={patient.guardianPhone} />

        <div className="rounded-lg border border-border p-4 md:col-span-3">
          <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Address</p>
          <p className="text-lg">{patient.address || "—"}</p>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Diagnoses</h2>
          <Button
            size="sm"
            variant={showForm ? "secondary" : "default"}
            onClick={() => setShowForm((value) => !value)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Cancel" : "Add Diagnosis"}
          </Button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-border p-4">
            <form onSubmit={handleAddDiagnosis} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Namaste Code *" value={formData.namasteCode} onChange={(v) => setFormData({ ...formData, namasteCode: v })} />
                <InputField label="ICD-11 Code *" value={formData.icd11Code} onChange={(v) => setFormData({ ...formData, icd11Code: v })} />
              </div>

              <div>
                <label className="text-sm mb-1 block">Symptoms</label>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={2}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Clinical Notes</label>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={3}
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                />
              </div>

              <Button type="submit">Add Diagnosis</Button>
            </form>
          </div>
        )}

        {diagnoses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No diagnoses recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {diagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="rounded-lg border border-border p-4 flex justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {diagnosis.namasteCode} → {diagnosis.icd11Code}
                  </p>
                  <p className="text-xs text-muted-foreground">Recorded: {diagnosis.recordedAt}</p>
                  {diagnosis.symptoms && (
                    <p className="text-sm">
                      <span className="font-semibold">Symptoms: </span>
                      {diagnosis.symptoms}
                    </p>
                  )}
                  {diagnosis.clinicalNotes && (
                    <p className="text-sm">
                      <span className="font-semibold">Notes: </span>
                      {diagnosis.clinicalNotes}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => handleDeleteDiagnosis(diagnosis.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">{label}</p>
      <p className="text-lg">{value || "—"}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm mb-1 block">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
