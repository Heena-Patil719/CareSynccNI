import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Eye, Trash2, Edit2, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  diagnosisCount: number;
  createdAt: string;
  healthUpdates?: HealthUpdate[];
}

const mockPatients: Patient[] = [
  {
    id: "P001",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1980-01-15",
    gender: "male",
    diagnosisCount: 2,
    createdAt: "2024-01-01",
    healthUpdates: [
      { date: "2024-01-01", bloodPressure: "120/80", heartRate: 72, temperature: 98.6 },
      { date: "2024-01-08", bloodPressure: "122/82", heartRate: 74, temperature: 98.7 },
      { date: "2024-01-15", bloodPressure: "121/81", heartRate: 71, temperature: 98.5 },
      { date: "2024-01-22", bloodPressure: "119/79", heartRate: 70, temperature: 98.6 },
      { date: "2024-01-29", bloodPressure: "118/78", heartRate: 69, temperature: 98.4 },
    ],
  },
  {
    id: "P002",
    firstName: "Sarah",
    lastName: "Smith",
    dateOfBirth: "1992-06-22",
    gender: "female",
    diagnosisCount: 1,
    createdAt: "2024-01-05",
    healthUpdates: [
      { date: "2024-01-05", bloodPressure: "110/70", heartRate: 65, temperature: 98.2 },
      { date: "2024-01-12", bloodPressure: "112/72", heartRate: 67, temperature: 98.3 },
      { date: "2024-01-19", bloodPressure: "111/71", heartRate: 64, temperature: 98.2 },
      { date: "2024-01-26", bloodPressure: "110/70", heartRate: 63, temperature: 98.1 },
    ],
  },
  {
    id: "P003",
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: "1975-03-10",
    gender: "male",
    diagnosisCount: 3,
    createdAt: "2024-01-08",
    healthUpdates: [
      { date: "2024-01-08", bloodPressure: "130/85", heartRate: 80, temperature: 99.1 },
      { date: "2024-01-15", bloodPressure: "128/84", heartRate: 78, temperature: 98.9 },
      { date: "2024-01-22", bloodPressure: "125/82", heartRate: 76, temperature: 98.7 },
      { date: "2024-01-29", bloodPressure: "122/80", heartRate: 74, temperature: 98.6 },
    ],
  },
];

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientGraph, setExpandedPatientGraph] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male" as const,
  });

  const filteredPatients = patients.filter(
    (p) =>
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    const newPatient: Patient = {
      id: `P${Date.now()}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      diagnosisCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      healthUpdates: [],
    };

    setPatients([...patients, newPatient]);
    setFormData({ firstName: "", lastName: "", dateOfBirth: "", gender: "male" });
    setShowForm(false);
  };

  const handleDeletePatient = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
  };

  const getHeartRateData = (updates: HealthUpdate[] = []) => {
    return updates.map((u) => ({
      date: u.date.slice(-5),
      heartRate: u.heartRate,
    }));
  };

  const getTemperatureData = (updates: HealthUpdate[] = []) => {
    return updates.map((u) => ({
      date: u.date.slice(-5),
      temperature: u.temperature,
    }));
  };

  const getBloodPressureData = (updates: HealthUpdate[] = []) => {
    return updates.map((u) => {
      const [systolic] = u.bloodPressure.split("/").map(Number);
      return {
        date: u.date.slice(-5),
        systolic,
      };
    });
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Patient Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage patient records, attach diagnoses, and export FHIR
              data
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
              variant={showForm ? "secondary" : "default"}
            >
              <Plus className="w-4 h-4" />
              {showForm ? "Cancel" : "Create Patient"}
            </Button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
            <h2 className="text-lg font-semibold mb-4">New Patient</h2>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    First Name *
                  </label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Last Name *
                  </label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Gender
                  </label>
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
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Patient</Button>
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

        {/* Search */}
        <div>
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <p className="text-sm text-muted-foreground mt-2">
            {filteredPatients.length} of {patients.length} patients
          </p>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No patients found matching your search"
                : "No patients created yet. Click 'Create Patient' to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="space-y-3">
                <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        {patient.dateOfBirth && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {patient.dateOfBirth}
                          </div>
                        )}
                        {patient.gender && (
                          <span className="capitalize">{patient.gender}</span>
                        )}
                        <span>
                          {patient.diagnosisCount}{" "}
                          {patient.diagnosisCount === 1
                            ? "diagnosis"
                            : "diagnoses"}
                        </span>
                        <span>Created {patient.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedPatientGraph(
                            expandedPatientGraph === patient.id ? null : patient.id
                          )
                        }
                      >
                        {expandedPatientGraph === patient.id ? "Hide" : "Show"} Health Data
                      </Button>
                      <Link to={`/patients/${patient.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          /* Edit functionality */
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePatient(patient.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Health Update Graphs */}
                {expandedPatientGraph === patient.id && patient.healthUpdates && patient.healthUpdates.length > 0 && (
                  <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50 animate-slide-up">
                    <h4 className="font-semibold mb-4">Health Update Trends</h4>
                    
                    {/* Heart Rate Graph */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Heart Rate (bpm)</h5>
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getHeartRateData(patient.healthUpdates)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" domain={[60, 85]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                              }}
                              labelStyle={{ color: "var(--foreground)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="heartRate"
                              stroke="var(--primary)"
                              strokeWidth={2}
                              dot={{ fill: "var(--primary)", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Temperature Graph */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Temperature (°F)</h5>
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getTemperatureData(patient.healthUpdates)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" domain={[97, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                              }}
                              labelStyle={{ color: "var(--foreground)" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="temperature"
                              fill="var(--secondary)"
                              stroke="var(--secondary)"
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Blood Pressure Graph */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Blood Pressure Systolic (mmHg)</h5>
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getBloodPressureData(patient.healthUpdates)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" domain={[110, 135]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                              }}
                              labelStyle={{ color: "var(--foreground)" }}
                            />
                            <Bar dataKey="systolic" fill="var(--primary)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {patients.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border pt-8">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Total Patients
              </p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Total Diagnoses
              </p>
              <p className="text-2xl font-bold">
                {patients.reduce((sum, p) => sum + p.diagnosisCount, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Avg Diagnoses
              </p>
              <p className="text-2xl font-bold">
                {(
                  patients.reduce((sum, p) => sum + p.diagnosisCount, 0) /
                  patients.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                This Month
              </p>
              <p className="text-2xl font-bold">
                {
                  patients.filter((p) =>
                    p.createdAt.startsWith(
                      new Date().toISOString().split("T")[0].slice(0, 7)
                    )
                  ).length
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
