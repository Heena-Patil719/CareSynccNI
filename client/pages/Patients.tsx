import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddPatientModal } from "@/components/AddPatientModal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Patient {
  patientId: string;
  name: string;
  age: number;
  ward: string;
  bedNumber: string;
  status: string;
  assignedDoctor: string;
  admittedAt: string;
}

const statusColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  stable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  admitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  discharged: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  "under observation": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function Patients() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
  });

  const filteredPatients = patients.filter((p) => {
    const pName = p.name || `${(p as any).firstName || ""} ${(p as any).lastName || ""}`.trim() || "Unknown";
    const pId = p.patientId || "Unknown";
    const pWard = p.ward || "Unknown";
    const pStatus = p.status || "Unknown";
    
    const matchesSearch =
      pName.toLowerCase().includes(search.toLowerCase()) ||
      pId.toLowerCase().includes(search.toLowerCase());
    const matchesWard = wardFilter === "all" || pWard === wardFilter;
    const matchesStatus = statusFilter === "all" || pStatus === statusFilter;
    return matchesSearch && matchesWard && matchesStatus;
  });

  const uniqueWards = Array.from(new Set(patients.map((p) => p.ward || "Unknown")));

  const statusCounts = patients.reduce((acc, p) => {
    const s = p.status || "Unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) return <div className="p-8">Loading patients...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage and view all patient records</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Patient
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="bg-card border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm min-w-fit">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-bold">{patients.length}</span>
        </div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-card border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm min-w-fit capitalize">
            <span className="text-sm text-muted-foreground">{status}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {uniqueWards.map(w => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="under observation">Under Observation</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="discharged">Discharged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <div className="bg-accent/50 p-4 rounded-full mb-4">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium">No patients found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Bed No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow
                  key={patient.patientId}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/patients/${patient.patientId}`)}
                >
                  <TableCell className="font-medium text-primary">
                    {patient.patientId || "Legacy"}
                  </TableCell>
                  <TableCell className="font-semibold">{patient.name || `${(patient as any).firstName || ""} ${(patient as any).lastName || ""}`.trim()}</TableCell>
                  <TableCell>{patient.age || "-"}</TableCell>
                  <TableCell>{patient.ward || "Unknown"}</TableCell>
                  <TableCell>{patient.bedNumber || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize flex w-max items-center ${statusColors[patient.status || "Unknown"] || "bg-gray-100 text-gray-800"}`}>
                      {patient.status || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>{patient.assignedDoctor || "-"}</TableCell>
                  <TableCell>{patient.admittedAt ? format(new Date(patient.admittedAt), "MMM d, yyyy") : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/patients/${patient.patientId}`} onClick={(e) => e.stopPropagation()}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AddPatientModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  );
}
