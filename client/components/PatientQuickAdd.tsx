import { useEffect, useState } from "react";
import { PlusCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

type DashboardPatient = {
  id: string;
  patient: {
    name: Array<{
      given: string[];
      family: string;
    }>;
  };
  createdAt: string;
};

interface PatientQuickAddProps {
  onPatientAdded?: (patient: DashboardPatient) => void;
  recentPatients?: DashboardPatient[];
}

export default function PatientQuickAdd({ onPatientAdded, recentPatients }: PatientQuickAddProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "male",
  });

  useEffect(() => {
    if (recentPatients) {
      setPatients(recentPatients.slice(0, 5));
      return;
    }

    const loadPatients = async () => {
      if (!user?.id) {
        setPatients([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/patients", {
          headers: {
            "x-user-id": user.id,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to load patients");
        }

        const payload = (await response.json()) as { patients: DashboardPatient[] };
        setPatients(payload.patients.slice(0, 5));
      } catch (loadError) {
        console.error("Load patients error:", loadError);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [recentPatients, user?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (!user?.id) {
      setError("You must be logged in.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formData.birthDate || undefined,
          gender: formData.gender,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create patient");
      }

      const patient = (await response.json()) as DashboardPatient;
      setPatients((currentPatients) => [patient, ...currentPatients].slice(0, 5));
      onPatientAdded?.(patient);
      setSuccess("Patient saved to MongoDB.");
      setFormData({
        firstName: "",
        lastName: "",
        birthDate: "",
        gender: "male",
      });
    } catch (submitError) {
      console.error("Create patient error:", submitError);
      setError("Unable to save patient right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[1.2fr,0.8fr]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Quick Patient Add</h2>
            <p className="text-sm text-muted-foreground">
              Create a patient record on the backend and persist it in MongoDB.
            </p>
          </div>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            placeholder="First name"
            value={formData.firstName}
            onChange={(event) =>
              setFormData((current) => ({ ...current, firstName: event.target.value }))
            }
          />
          <Input
            placeholder="Last name"
            value={formData.lastName}
            onChange={(event) =>
              setFormData((current) => ({ ...current, lastName: event.target.value }))
            }
          />
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(event) =>
              setFormData((current) => ({ ...current, birthDate: event.target.value }))
            }
          />
          <select
            value={formData.gender}
            onChange={(event) =>
              setFormData((current) => ({ ...current, gender: event.target.value }))
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit" className="gap-2" disabled={saving}>
              <PlusCircle className="h-4 w-4" />
              {saving ? "Saving..." : "Save Patient"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-muted/40 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recently Added
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading MongoDB patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No backend patients saved yet.</p>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => (
              <div key={patient.id} className="rounded-xl border border-border bg-background p-3">
                <p className="font-medium">
                  {patient.patient.name[0]?.given.join(" ")} {patient.patient.name[0]?.family}
                </p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(patient.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
