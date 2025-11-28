import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Settings,
  Upload,
  Edit2,
  Trash2,
  BarChart3,
  Users,
  Database,
  TrendingUp,
  Download,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NAMASTECode {
  id: string;
  code: string;
  description: string;
  category: "Ayurveda" | "Siddha" | "Unani";
  createdAt: string;
}

interface Mapping {
  id: string;
  namasteCode: string;
  icd11Code: string;
  confidence: number;
  status: "verified" | "pending";
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
  lastLogin?: string;
}

// Mock data
const mockCodes: NAMASTECode[] = [
  {
    id: "C1",
    code: "AYR-001",
    description: "Vata Vyadhi (Wind Disorder)",
    category: "Ayurveda",
    createdAt: "2024-01-01",
  },
  {
    id: "C2",
    code: "SID-045",
    description: "Pitta Roga (Pitta Disease)",
    category: "Siddha",
    createdAt: "2024-01-02",
  },
  {
    id: "C3",
    code: "UNA-012",
    description: "Humoral Imbalance",
    category: "Unani",
    createdAt: "2024-01-03",
  },
];

const mockMappings: Mapping[] = [
  {
    id: "M1",
    namasteCode: "AYR-001",
    icd11Code: "BA25.1",
    confidence: 0.94,
    status: "verified",
    createdAt: "2024-01-01",
  },
  {
    id: "M2",
    namasteCode: "SID-045",
    icd11Code: "DA90",
    confidence: 0.87,
    status: "verified",
    createdAt: "2024-01-02",
  },
  {
    id: "M3",
    namasteCode: "UNA-012",
    icd11Code: "QD82",
    confidence: 0.76,
    status: "pending",
    createdAt: "2024-01-03",
  },
];

const mockUsers: User[] = [
  {
    id: "U1",
    name: "Admin User",
    email: "admin@caresync.com",
    role: "admin",
    createdAt: "2024-01-01",
    lastLogin: "2024-01-20",
  },
  {
    id: "U2",
    name: "Editor User",
    email: "editor@caresync.com",
    role: "editor",
    createdAt: "2024-01-05",
    lastLogin: "2024-01-19",
  },
  {
    id: "U3",
    name: "Viewer User",
    email: "viewer@caresync.com",
    role: "viewer",
    createdAt: "2024-01-10",
    lastLogin: "2024-01-15",
  },
];

type TabType = "codes" | "mappings" | "coverage" | "users";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>("codes");
  const [codes, setCodes] = useState<NAMASTECode[]>(mockCodes);
  const [mappings, setMappings] = useState<Mapping[]>(mockMappings);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [codeFormData, setCodeFormData] = useState({
    code: "",
    description: "",
    category: "Ayurveda" as const,
  });
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as const,
  });

  // Coverage calculation
  const totalCodes = codes.length;
  const mappedCodes = mappings.filter((m) => m.status === "verified").length;
  const coveragePercentage =
    totalCodes > 0 ? Math.round((mappedCodes / totalCodes) * 100) : 0;

  const handleAddCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeFormData.code || !codeFormData.description) return;

    const newCode: NAMASTECode = {
      id: `C${Date.now()}`,
      code: codeFormData.code,
      description: codeFormData.description,
      category: codeFormData.category,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCodes([...codes, newCode]);
    setCodeFormData({ code: "", description: "", category: "Ayurveda" });
    setShowCodeForm(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) return;

    const newUser: User = {
      id: `U${Date.now()}`,
      name: userFormData.name,
      email: userFormData.email,
      role: userFormData.role,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, newUser]);
    setUserFormData({ name: "", email: "", role: "viewer" });
    setShowUserForm(false);
  };

  const handleDeleteCode = (id: string) => {
    setCodes(codes.filter((c) => c.id !== id));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleDownloadMappings = () => {
    const csv = [
      ["NAMASTE Code", "ICD-11 Code", "Confidence", "Status"],
      ...mappings.map((m) => [
        m.namasteCode,
        m.icd11Code,
        m.confidence.toString(),
        m.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mappings.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "codes",
      label: "NAMASTE Codes",
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: "mappings",
      label: "Mappings",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "coverage",
      label: "Coverage",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage codes, mappings, coverage, and system users
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Total Codes
              </p>
              <p className="text-2xl font-bold">{codes.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Total Mappings
              </p>
              <p className="text-2xl font-bold">{mappings.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Coverage
              </p>
              <p className="text-2xl font-bold">{coveragePercentage}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                Total Users
              </p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-border">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-b-primary text-primary"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}

        {/* NAMASTE Codes Tab */}
        {activeTab === "codes" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCodeForm(!showCodeForm)}
                className="gap-2"
                variant={showCodeForm ? "secondary" : "default"}
              >
                <Plus className="w-4 h-4" />
                {showCodeForm ? "Cancel" : "Add Code"}
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            {showCodeForm && (
              <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
                <h3 className="font-semibold mb-4">Add New Code</h3>
                <form onSubmit={handleAddCode} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Code *
                      </label>
                      <Input
                        placeholder="e.g., AYR-001"
                        value={codeFormData.code}
                        onChange={(e) =>
                          setCodeFormData({
                            ...codeFormData,
                            code: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Description *
                      </label>
                      <Input
                        placeholder="Code description"
                        value={codeFormData.description}
                        onChange={(e) =>
                          setCodeFormData({
                            ...codeFormData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Category
                      </label>
                      <select
                        value={codeFormData.category}
                        onChange={(e) =>
                          setCodeFormData({
                            ...codeFormData,
                            category: e.target.value as
                              | "Ayurveda"
                              | "Siddha"
                              | "Unani",
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      >
                        <option value="Ayurveda">Ayurveda</option>
                        <option value="Siddha">Siddha</option>
                        <option value="Unani">Unani</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Code</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCodeForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{code.code}</div>
                    <p className="text-sm text-muted-foreground">
                      {code.description}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span className="px-2 py-1 bg-muted rounded">
                        {code.category}
                      </span>
                      <span>{code.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteCode(code.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mappings Tab */}
        {activeTab === "mappings" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Mappings CSV
              </Button>
              <Button
                onClick={handleDownloadMappings}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Mappings
              </Button>
            </div>

            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{mapping.namasteCode}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="font-semibold">{mapping.icd11Code}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Confidence
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded w-24 overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${mapping.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold">
                            {Math.round(mapping.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            mapping.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {mapping.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Tab */}
        {activeTab === "coverage" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-8">
              <h3 className="font-semibold text-lg mb-6">Mapping Coverage</h3>
              <div className="space-y-6">
                {/* Overall Coverage */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Overall Coverage</span>
                    <span className="text-2xl font-bold text-primary">
                      {coveragePercentage}%
                    </span>
                  </div>
                  <div className="w-full h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${coveragePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {mappedCodes} of {totalCodes} codes mapped
                  </p>
                </div>

                {/* Coverage by Category */}
                <div>
                  <h4 className="font-medium mb-4">By Category</h4>
                  <div className="space-y-4">
                    {["Ayurveda", "Siddha", "Unani"].map((category) => {
                      const catCodes = codes.filter(
                        (c) => c.category === category
                      ).length;
                      const catMappings = mappings.filter(
                        (m) =>
                          codes.find(
                            (c) =>
                              c.code === m.namasteCode &&
                              c.category === category
                          ) && m.status === "verified"
                      ).length;
                      const percentage =
                        catCodes > 0
                          ? Math.round((catMappings / catCodes) * 100)
                          : 0;

                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">{category}</span>
                            <span className="text-sm font-semibold">
                              {percentage}% ({catMappings}/{catCodes})
                            </span>
                          </div>
                          <div className="w-full h-6 bg-muted rounded-lg overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                percentage > 80
                                  ? "bg-green-500"
                                  : percentage > 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-border pt-6">
                  <h4 className="font-medium mb-4">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        Verified
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {mappings.filter((m) => m.status === "verified").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {mappings.filter((m) => m.status === "pending").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        Unmapped
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {totalCodes - mappedCodes}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        Avg Confidence
                      </p>
                      <p className="text-2xl font-bold">
                        {(
                          mappings.reduce((sum, m) => sum + m.confidence, 0) /
                          mappings.length
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowUserForm(!showUserForm)}
                className="gap-2"
                variant={showUserForm ? "secondary" : "default"}
              >
                <Plus className="w-4 h-4" />
                {showUserForm ? "Cancel" : "Add User"}
              </Button>
            </div>

            {showUserForm && (
              <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
                <h3 className="font-semibold mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Name *
                      </label>
                      <Input
                        placeholder="Full name"
                        value={userFormData.name}
                        onChange={(e) =>
                          setUserFormData({
                            ...userFormData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={userFormData.email}
                        onChange={(e) =>
                          setUserFormData({
                            ...userFormData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Role
                      </label>
                      <select
                        value={userFormData.role}
                        onChange={(e) =>
                          setUserFormData({
                            ...userFormData,
                            role: e.target.value as
                              | "admin"
                              | "editor"
                              | "viewer",
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add User</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{user.name}</div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded font-medium",
                          user.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : user.role === "editor"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {user.role}
                      </span>
                      <span>Created {user.createdAt}</span>
                      {user.lastLogin && (
                        <span>Last login {user.lastLogin}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
