import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface HealthUpdate {
  date: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  notes?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  admitDate?: string;
  diagnosis?: string;
  email?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  diagnosisCount: number;
  createdAt: string;
  healthUpdates?: HealthUpdate[];
}

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    admitDate: "",
    diagnosis: "",
    email: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
  });

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/patients");
      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load patients");
      }

      setPatients(data.patients || []);
    } catch (fetchError) {
      console.error("Fetch patients error:", fetchError);
      setPatients([]);
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender,
          admitDate: formData.admitDate || undefined,
          diagnosis: formData.diagnosis || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          guardianName: formData.guardianName || undefined,
          guardianPhone: formData.guardianPhone || undefined,
          address: formData.address || undefined,
        }),
      });

      const data = await readJson(res);
      if (!res.ok) {
        throw new Error(data.error || "Failed to create patient");
      }

      if (data.patient) {
        setPatients((prev) => [data.patient, ...prev]);
      }

      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "male",
        admitDate: "",
        diagnosis: "",
        email: "",
        phone: "",
        guardianName: "",
        guardianPhone: "",
        address: "",
      });
      setShowForm(false);
    } catch (createError) {
      console.error("Create patient error:", createError);
      alert(createError instanceof Error ? createError.message : "Failed to create patient.");
    }
  };

  const handleDeletePatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete patient");
      }

      setPatients((prev) => prev.filter((patient) => patient.id !== id));
    } catch (deleteError) {
      console.error("Delete patient error:", deleteError);
      alert("Failed to delete patient");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Patient Management</h1>
          <p className="text-muted-foreground">Create and manage patient records</p>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Create Patient"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4">New Patient</h2>

          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First Name *" value={formData.firstName} onChange={(v) => setFormData({ ...formData, firstName: v })} />
              <InputField label="Last Name *" value={formData.lastName} onChange={(v) => setFormData({ ...formData, lastName: v })} />
              <InputField type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={(v) => setFormData({ ...formData, dateOfBirth: v })} />

              <div>
                <label className="text-sm font-medium mb-1 block">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as "male" | "female" | "other",
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <InputField type="date" label="Admit Date" value={formData.admitDate} onChange={(v) => setFormData({ ...formData, admitDate: v })} />
              <InputField label="Diagnosis" value={formData.diagnosis} onChange={(v) => setFormData({ ...formData, diagnosis: v })} />
              <InputField label="Email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
              <InputField label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
              <InputField label="Guardian Name" value={formData.guardianName} onChange={(v) => setFormData({ ...formData, guardianName: v })} />
              <InputField label="Guardian Phone" value={formData.guardianPhone} onChange={(v) => setFormData({ ...formData, guardianPhone: v })} />

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Address</label>
                <textarea
                  placeholder="Full address"
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create Patient</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div>
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No patients found.</div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {patient.dateOfBirth} · {patient.gender}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link to={`/patients/${patient.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePatient(patient.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <Input type={type} value={value} placeholder={label} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
