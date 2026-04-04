import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  AlertTriangle,
  MapPin,
  ClipboardList,
  User,
  Phone,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AlertItem {
  _id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  readingValue: string | number;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
}

interface HealthUpdateItem {
  _id: string;
  bloodPressure?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

interface VitalsFormState {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  notes: string;
  recordedBy: string;
}

interface ContactInfoState {
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
}

interface MedInfoState {
  diagnosis: string;
  notes: string;
  assignedDoctor: string;
  ward: string;
  bedNumber: string;
  icd11Code: string;
  namasteCode: string;
}

const statusColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  stable: "bg-green-100 text-green-800",
  admitted: "bg-blue-100 text-blue-800",
  discharged: "bg-gray-100 text-gray-800",
  "under observation": "bg-yellow-100 text-yellow-800",
};

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: patientLoading, error: patientError } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error("Patient not found");
      return res.json();
    },
    retry: false,
  });

  const { data: healthUpdates = [] } = useQuery<HealthUpdateItem[]>({
    queryKey: ["healthUpdates", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/health-updates`);
      if (!res.ok) throw new Error("Failed to fetch updates");
      return res.json();
    },
  });

  const { data: alertsRes } = useQuery<{ alerts: AlertItem[] }>({
    queryKey: ["alerts", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/alerts/patient/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });
  
  const alerts = alertsRes?.alerts || [];
  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      toast.success("Patient updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const vitalsMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/patients/${patientId}/health-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add vitals");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthUpdates", patientId] });
      queryClient.invalidateQueries({ queryKey: ["alerts", patientId] });
      toast.success("Vitals added successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ackAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", patientId] });
      toast.success("Alert acknowledged");
    },
  });

  const [vitalsForm, setVitalsForm] = useState<VitalsFormState>({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
    weight: "",
    notes: "",
    recordedBy: "",
  });

  const [medInfo, setMedInfo] = useState<MedInfoState | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfoState | null>(null);

  if (patientLoading) return <div className="p-8">Loading patient data...</div>;
  
  if (patientError || !patient) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Patient Not Found</h2>
        <p className="text-muted-foreground">The patient ID {patientId} does not exist or has been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/patients"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients</Link>
        </Button>
      </div>
    );
  }

  // Initialize forms if null
  if (!medInfo) {
    setMedInfo({
      diagnosis: patient.diagnosis,
      notes: patient.notes || "",
      assignedDoctor: patient.assignedDoctor,
      ward: patient.ward,
      bedNumber: patient.bedNumber,
      icd11Code: patient.icd11Code || (patient as any).icd11_code || "",
      namasteCode: patient.namasteCode || (patient as any).namaste_code || "",
    });
  }
  if (!contactInfo) {
    const contact = patient.contact || {};
    const emergencyContact = contact.emergencyContact || {};
    setContactInfo({
      phone: contact.phone || patient.phone || "",
      email: contact.email || patient.email || "",
      address: patient.address || "",
      emergencyName: emergencyContact.name || patient.guardianName || "",
      emergencyRelation: emergencyContact.relation || "",
      emergencyPhone: emergencyContact.phone || patient.guardianPhone || "",
    });
  }

  const latestVitals = healthUpdates[0] as HealthUpdateItem | undefined;
  const chartData = [...healthUpdates].reverse().slice(-10).map((h) => ({
    time: format(new Date(h.recordedAt), "HH:mm"),
    BP: h.bloodPressure,
    HR: h.heartRate,
    Temp: h.temperature,
  }));

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsForm.recordedBy) {
      toast.error("Recorded By is required");
      return;
    }
    const payload: Record<string, unknown> = { recordedBy: vitalsForm.recordedBy };
    if (vitalsForm.bloodPressure) payload.bloodPressure = Number(vitalsForm.bloodPressure);
    if (vitalsForm.heartRate) payload.heartRate = Number(vitalsForm.heartRate);
    if (vitalsForm.temperature) payload.temperature = Number(vitalsForm.temperature);
    if (vitalsForm.oxygenSaturation) payload.oxygenSaturation = Number(vitalsForm.oxygenSaturation);
    if (vitalsForm.weight) payload.weight = Number(vitalsForm.weight);
    if (vitalsForm.notes) payload.notes = vitalsForm.notes;
    
    vitalsMutation.mutate(payload, {
      onSuccess: () => setVitalsForm({ bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "", weight: "", notes: "", recordedBy: "" })
    });
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (medInfo) updateMutation.mutate(medInfo as unknown as Record<string, unknown>);
  };
  
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactInfo) {
      updateMutation.mutate({
        address: contactInfo.address,
        contact: {
          phone: contactInfo.phone,
          email: contactInfo.email,
          emergencyContact: {
            name: contactInfo.emergencyName,
            relation: contactInfo.emergencyRelation,
            phone: contactInfo.emergencyPhone,
          }
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="space-y-1">
          <Button variant="link" asChild className="p-0 h-auto text-muted-foreground mb-2">
            <Link to="/patients"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Patients</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">{patient.name || `${(patient as any).firstName || ""} ${(patient as any).lastName || ""}`.trim() || "Unknown"}</h1>
            <Badge variant="outline" className="text-sm border-primary/20 bg-primary/5">{patient.patientId || "Legacy"}</Badge>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${statusColors[patient.status || "Unknown"] || "bg-gray-100"}`}>
              {patient.status || "Unknown"}
            </span>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
              ICD-11: {patient.icd11Code || (patient as any).icd11_code || "N/A"}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
              NAMASTE: {patient.namasteCode || (patient as any).namaste_code || "N/A"}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1"><User className="w-4 h-4"/> {patient.age || "-"}y, {patient.gender || "-"}</div>
            <div className="flex items-center gap-1"><Activity className="w-4 h-4"/> Blood: {patient.bloodGroup || "-"}</div>
            <div className="flex items-center gap-1"><MapPin className="w-4 h-4"/> Ward: {patient.ward || "-"}, Bed {patient.bedNumber || "-"}</div>
          </div>
          
          <div className="text-sm font-medium mt-2">
            Assigned to <span className="text-primary">{patient.assignedDoctor || "-"}</span>
            <span className="text-muted-foreground ml-2">
              • Admitted {patient.admittedAt ? format(new Date(patient.admittedAt), "MMM d, yyyy") : "-"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select 
            value={patient.status || "admitted"} 
            onValueChange={(val) => updateMutation.mutate({ status: val })}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="under observation">Under Observation</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="discharged">Discharged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto md:w-max w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals History</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts {activeAlerts.length > 0 && <Badge className="ml-2 bg-red-500">{activeAlerts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {activeAlerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeAlerts.map((a) => (
                <div key={a._id} className="bg-red-50 border border-red-200 text-red-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">{a.type} Alert:</span> {a.message}
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-card p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-primary" /> General Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase">Diagnosis</p>
                    <p className="font-medium text-lg">{patient.diagnosis || "-"}</p>
                  </div>
                  {patient.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase">Address</p>
                    <p className="text-sm">{patient.address || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Emergency Contact</h3>
                <div className="bg-accent/30 p-4 rounded-lg">
                  <p className="font-bold">{patient.contact?.emergencyContact?.name || patient.guardianName || "-"}</p>
                  <p className="text-sm text-muted-foreground mb-2">{patient.contact?.emergencyContact?.relation || "-"}</p>
                  <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4" /> {patient.contact?.emergencyContact?.phone || patient.guardianPhone || "-"}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" /> Latest Vitals
              </h3>
              
              {latestVitals ? (
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Blood Pressure</p>
                    <p className="text-2xl font-bold flex items-baseline gap-1">
                      {latestVitals.bloodPressure || "--"} <span className="text-sm font-normal text-muted-foreground">mmHg</span>
                    </p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-lg flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-2xl font-bold flex items-baseline gap-1">
                      {latestVitals.heartRate || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span>
                    </p>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-lg flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-2xl font-bold flex items-baseline gap-1">
                      {latestVitals.temperature || "--"} <span className="text-sm font-normal text-muted-foreground">°C</span>
                    </p>
                  </div>
                  <div className="bg-cyan-50/50 p-4 rounded-lg flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">SpO2</p>
                    <p className="text-2xl font-bold flex items-baseline gap-1">
                      {latestVitals.oxygenSaturation || "--"} <span className="text-sm font-normal text-muted-foreground">%</span>
                    </p>
                  </div>
                  <div className="col-span-2 text-right mt-auto">
                    <p className="text-xs text-muted-foreground">
                      Recorded by {latestVitals.recordedBy} at {format(new Date(latestVitals.recordedAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  No vitals recorded yet.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6 mt-6">
          <div className="bg-card p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Add New Vitals</h3>
            <form onSubmit={handleVitalsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1"><Label>BP (systolic)</Label><Input type="number" value={vitalsForm.bloodPressure} onChange={e => setVitalsForm({...vitalsForm, bloodPressure: e.target.value})} placeholder="120" /></div>
                <div className="space-y-1"><Label>Heart Rate (bpm)</Label><Input type="number" value={vitalsForm.heartRate} onChange={e => setVitalsForm({...vitalsForm, heartRate: e.target.value})} placeholder="72" /></div>
                <div className="space-y-1"><Label>Temp (°C)</Label><Input type="number" step="0.1" value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})} placeholder="37.0" /></div>
                <div className="space-y-1"><Label>SpO2 (%)</Label><Input type="number" value={vitalsForm.oxygenSaturation} onChange={e => setVitalsForm({...vitalsForm, oxygenSaturation: e.target.value})} placeholder="98" /></div>
                <div className="space-y-1"><Label>Weight (kg)</Label><Input type="number" step="0.1" value={vitalsForm.weight} onChange={e => setVitalsForm({...vitalsForm, weight: e.target.value})} /></div>
                <div className="space-y-1 md:col-span-2"><Label>Notes</Label><Input value={vitalsForm.notes} onChange={e => setVitalsForm({...vitalsForm, notes: e.target.value})} /></div>
                <div className="space-y-1"><Label>Recorded By *</Label><Input value={vitalsForm.recordedBy} onChange={e => setVitalsForm({...vitalsForm, recordedBy: e.target.value})} placeholder="Nurse Joy" required/></div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={vitalsMutation.isPending}>{vitalsMutation.isPending ? "Saving..." : "Save Vitals"}</Button>
              </div>
            </form>
          </div>

          {healthUpdates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-xl border shadow-sm h-64">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Blood Pressure Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis domain={['auto', 'auto']}/><Tooltip/><Line type="monotone" dataKey="BP" stroke="#3b82f6" strokeWidth={2}/></LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card p-4 rounded-xl border shadow-sm h-64">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Heart Rate Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis domain={['auto', 'auto']}/><Tooltip/><Line type="monotone" dataKey="HR" stroke="#ef4444" strokeWidth={2}/></LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card p-4 rounded-xl border shadow-sm h-64">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Temperature Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis domain={['auto', 'auto']}/><Tooltip/><Line type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2}/></LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>BP</TableHead><TableHead>HR</TableHead><TableHead>Temp</TableHead><TableHead>SpO2</TableHead><TableHead>Recorded By</TableHead></TableRow></TableHeader>
              <TableBody>
                {healthUpdates.map((h) => (
                  <TableRow key={h._id}>
                    <TableCell className="font-medium">{format(new Date(h.recordedAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell>{h.bloodPressure || "-"}</TableCell>
                    <TableCell>{h.heartRate || "-"}</TableCell>
                    <TableCell>{h.temperature || "-"}</TableCell>
                    <TableCell>{h.oxygenSaturation || "-"}</TableCell>
                    <TableCell>{h.recordedBy}</TableCell>
                  </TableRow>
                ))}
                {healthUpdates.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No updates found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert._id} className={!alert.acknowledged && alert.severity === "CRITICAL" ? "border-l-4 border-l-red-500 bg-red-50/10" : !alert.acknowledged && alert.severity === "HIGH" ? "border-l-4 border-l-orange-500 bg-orange-50/10" : !alert.acknowledged ? "border-l-4 border-l-yellow-400 bg-yellow-50/10" : ""}>
                    <TableCell>
                      <Badge variant={alert.severity === "CRITICAL" ? "destructive" : "default"} className={alert.severity === "HIGH" ? "bg-orange-500" : alert.severity === "LOW" ? "bg-yellow-500" : ""}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell className="font-mono text-sm">{alert.readingValue}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(alert.triggeredAt), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="text-right">
                      {!alert.acknowledged ? (
                        <Button size="sm" variant="outline" onClick={() => ackAlertMutation.mutate(alert._id)}>Acknowledge</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ack'd</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No alerts associated with this patient.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="mt-6 space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm max-w-2xl">
            <h3 className="font-semibold text-lg mb-4">Medical Information</h3>
            <form onSubmit={handleMedSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ICD-11 Code</Label><Input value={medInfo?.icd11Code || ''} onChange={e => setMedInfo(prev => prev ? {...prev, icd11Code: e.target.value} : null)} placeholder="e.g. 1G41" /></div>
                <div className="space-y-2"><Label>NAMASTE Code</Label><Input value={medInfo?.namasteCode || ''} onChange={e => setMedInfo(prev => prev ? {...prev, namasteCode: e.target.value} : null)} placeholder="e.g. AYU-01" /></div>
              </div>
              <div className="space-y-2"><Label>Diagnosis</Label><Input value={medInfo?.diagnosis || ''} onChange={e => setMedInfo(prev => prev ? {...prev, diagnosis: e.target.value} : null)} /></div>
              <div className="space-y-2"><Label>Assigned Doctor</Label><Input value={medInfo?.assignedDoctor || ''} onChange={e => setMedInfo(prev => prev ? {...prev, assignedDoctor: e.target.value} : null)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ward</Label><Input value={medInfo?.ward || ''} onChange={e => setMedInfo(prev => prev ? {...prev, ward: e.target.value} : null)} /></div>
                <div className="space-y-2"><Label>Bed Number</Label><Input value={medInfo?.bedNumber || ''} onChange={e => setMedInfo(prev => prev ? {...prev, bedNumber: e.target.value} : null)} /></div>
              </div>
              <div className="space-y-2"><Label>Clinical Notes</Label><Textarea value={medInfo?.notes || ''} onChange={e => setMedInfo(prev => prev ? {...prev, notes: e.target.value} : null)} rows={5}/></div>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-6 space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm max-w-2xl">
            <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={contactInfo?.phone || ''} onChange={e => setContactInfo(prev => prev ? {...prev, phone: e.target.value} : null)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={contactInfo?.email || ''} onChange={e => setContactInfo(prev => prev ? {...prev, email: e.target.value} : null)} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Textarea value={contactInfo?.address || ''} onChange={e => setContactInfo(prev => prev ? {...prev, address: e.target.value} : null)} /></div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={contactInfo?.emergencyName || ''} onChange={e => setContactInfo(prev => prev ? {...prev, emergencyName: e.target.value} : null)} /></div>
                  <div className="space-y-2"><Label>Relation</Label><Input value={contactInfo?.emergencyRelation || ''} onChange={e => setContactInfo(prev => prev ? {...prev, emergencyRelation: e.target.value} : null)} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={contactInfo?.emergencyPhone || ''} onChange={e => setContactInfo(prev => prev ? {...prev, emergencyPhone: e.target.value} : null)} /></div>
                </div>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
