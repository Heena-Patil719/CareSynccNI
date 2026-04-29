import { useState } from "react";
import { ArrowRight, Database, Loader2, PlusCircle, SearchCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/use-toast";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type AgentCategory = "Ayurveda" | "Siddha" | "Unani";

interface AgentResult {
  namaste_code: string;
  namaste_name: string;
  icd11_code: string | null;
  icd11_name: string | null;
  confidence: number;
  status: "mapped" | "unmapped" | "partial";
  reasoning: string;
  symptoms: string[];
}

interface ApiSuggestion {
  namaste_code: string | null;
  namaste_name: string;
  icd11_code: string | null;
  icd11_name: string | null;
  category: AgentCategory | null;
  description: string | null;
  symptoms: string[];
  chapter: string | null;
  confidence: number;
  reasoning: string;
  storedInMongo: false;
}

interface AgentResponse {
  results: AgentResult[];
  apiSuggestions: ApiSuggestion[];
  aiUsed: boolean;
  aiMessage?: string;
  apiSuggestionMessage?: string;
}

const categories: Array<{ value: "" | AgentCategory; label: string }> = [
  { value: "", label: "All systems" },
  { value: "Ayurveda", label: "Ayurveda" },
  { value: "Siddha", label: "Siddha" },
  { value: "Unani", label: "Unani" },
];

type CreateTab = "namaste" | "icd11" | "mapping";

interface CreateErrorResponse {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function getConfidenceTone(confidence: number): string {
  if (confidence > 70) {
    return "bg-emerald-500";
  }

  if (confidence >= 40) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

function getStatusVariant(status: AgentResult["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "mapped":
      return "default";
    case "partial":
      return "secondary";
    case "unmapped":
      return "outline";
    default:
      return "outline";
  }
}

function getSuggestionChartData(suggestion: ApiSuggestion) {
  const labels = suggestion.symptoms.length ? suggestion.symptoms : ["No symptoms"];
  const values = suggestion.symptoms.length
    ? suggestion.symptoms.map((_, index) => Math.max(8, 42 - index * 7))
    : [100];

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ["#fb7185", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#f97316"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };
}

export function CodeMapperAgent() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"" | AgentCategory>("");
  const [results, setResults] = useState<AgentResult[]>([]);
  const [apiSuggestions, setApiSuggestions] = useState<ApiSuggestion[]>([]);
  const [aiUsed, setAiUsed] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [apiSuggestionMessage, setApiSuggestionMessage] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ApiSuggestion | null>(null);
  const [storageDraft, setStorageDraft] = useState<{
    namaste_code: string;
    namaste_name: string;
    icd11_code: string;
    icd11_name: string;
    category: AgentCategory;
    symptoms: string;
    description: string;
    status: "verified" | "pending";
  } | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createTab, setCreateTab] = useState<CreateTab>("namaste");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [namasteForm, setNamasteForm] = useState({
    code: "",
    name: "",
    description: "",
    category: "Ayurveda" as AgentCategory,
    symptoms: "",
  });
  const [icd11Form, setIcd11Form] = useState({
    code: "",
    name: "",
    description: "",
    chapter: "",
  });
  const [mappingForm, setMappingForm] = useState({
    namaste_code: "",
    icd11_code: "",
    confidence: "70",
    status: "pending" as "verified" | "pending",
    mappingCount: "1",
  });

  const buildStorageDraftFromSuggestion = (suggestion: ApiSuggestion) => ({
    namaste_code: suggestion.namaste_code ?? "",
    namaste_name: suggestion.namaste_name,
    icd11_code: suggestion.icd11_code ?? "",
    icd11_name: suggestion.icd11_name ?? "",
    category: suggestion.category ?? (category || "Ayurveda"),
    symptoms: suggestion.symptoms.join(", "),
    description: suggestion.description ?? suggestion.reasoning,
    status: "pending" as const,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) {
      setError("Enter a symptom description or NAMASTE code first.");
      return;
    }

    setLoading(true);
    setError(null);
    setStorageMessage(null);
    setStorageError(null);

    try {
      const response = await fetch("/api/agent/map-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          category: category || undefined,
        }),
      });

      const data = (await response.json()) as AgentResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error ?? "Agent request failed" : "Agent request failed");
      }

      if ("results" in data) {
        setResults(data.results);
        setApiSuggestions(data.apiSuggestions ?? []);
        setAiUsed(data.aiUsed);
        setAiMessage(data.aiMessage ?? null);
        setApiSuggestionMessage(data.apiSuggestionMessage ?? null);
        setSelectedSuggestion(null);
        setStorageDraft(null);
      } else {
        setResults([]);
        setApiSuggestions([]);
        setAiUsed(false);
        setAiMessage(null);
        setApiSuggestionMessage(null);
        setSelectedSuggestion(null);
        setStorageDraft(null);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Agent request failed");
      setResults([]);
      setApiSuggestions([]);
      setAiUsed(false);
      setAiMessage(null);
      setApiSuggestionMessage(null);
      setSelectedSuggestion(null);
      setStorageDraft(null);
    } finally {
      setLoading(false);
    }
  };

  const openStorageDraft = (suggestion: ApiSuggestion) => {
    setStorageMessage(null);
    setStorageError(null);
    setStorageDraft(buildStorageDraftFromSuggestion(suggestion));
  };

  const handleQuickStoreSuggestion = async (suggestion: ApiSuggestion) => {
    const draft = buildStorageDraftFromSuggestion(suggestion);

    if (!draft.namaste_code || !draft.icd11_code || !draft.namaste_name || !draft.icd11_name || !draft.description) {
      openStorageDraft(suggestion);
      setStorageError("Some required fields are missing, so please review and complete them before saving.");
      return;
    }

    setStorageLoading(true);
    setStorageMessage(null);
    setStorageError(null);

    try {
      const response = await fetch("/api/agent/manual-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as CreateErrorResponse;
      if (!response.ok) {
        throw new Error(extractCreateError(data));
      }

      setApiSuggestions((current) =>
        current.filter(
          (item) =>
            !(
              item.namaste_code === suggestion.namaste_code &&
              item.icd11_code === suggestion.icd11_code &&
              item.namaste_name === suggestion.namaste_name
            ),
        ),
      );
      setStorageDraft(null);
      setSelectedSuggestion(null);
      setStorageMessage(`Saved ${draft.namaste_code} -> ${draft.icd11_code} into MongoDB.`);
      toast.toast({
        title: "Added successfully",
        description: `${draft.namaste_code} was saved to MongoDB.`,
      });
    } catch (submitError) {
      setStorageError(submitError instanceof Error ? submitError.message : "Failed to save suggestion");
      openStorageDraft(suggestion);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleStoreSuggestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!storageDraft) {
      return;
    }

    setStorageLoading(true);
    setStorageMessage(null);
    setStorageError(null);

    try {
      const response = await fetch("/api/agent/manual-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storageDraft),
      });

      const data = (await response.json()) as CreateErrorResponse;
      if (!response.ok) {
        throw new Error(extractCreateError(data));
      }

      setStorageMessage(`Stored mapping ${storageDraft.namaste_code} -> ${storageDraft.icd11_code}.`);
      setStorageDraft(null);
      toast.toast({
        title: "Added successfully",
        description: `${storageDraft.namaste_code} was saved to MongoDB.`,
      });
    } catch (submitError) {
      setStorageError(submitError instanceof Error ? submitError.message : "Failed to save suggestion");
    } finally {
      setStorageLoading(false);
    }
  };

  const resetCreateMessages = () => {
    setCreateError(null);
    setCreateMessage(null);
  };

  const extractCreateError = (payload: CreateErrorResponse): string => {
    const fieldMessage = payload.fieldErrors
      ? Object.values(payload.fieldErrors).find((messages) => messages && messages.length > 0)?.[0]
      : undefined;

    return fieldMessage ?? payload.error ?? "Request failed";
  };

  const handleCreateNamaste = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateLoading(true);
    resetCreateMessages();

    try {
      const response = await fetch("/api/agent/namaste-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(namasteForm),
      });

      const data = (await response.json()) as CreateErrorResponse;
      if (!response.ok) {
        throw new Error(extractCreateError(data));
      }

      setCreateMessage(`NAMASTE code ${namasteForm.code} added.`);
      setNamasteForm({
        code: "",
        name: "",
        description: "",
        category: "Ayurveda",
        symptoms: "",
      });
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Failed to create NAMASTE code");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateIcd11 = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateLoading(true);
    resetCreateMessages();

    try {
      const response = await fetch("/api/agent/icd11-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(icd11Form),
      });

      const data = (await response.json()) as CreateErrorResponse;
      if (!response.ok) {
        throw new Error(extractCreateError(data));
      }

      setCreateMessage(`ICD-11 code ${icd11Form.code} added.`);
      setIcd11Form({
        code: "",
        name: "",
        description: "",
        chapter: "",
      });
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Failed to create ICD-11 code");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateMapping = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateLoading(true);
    resetCreateMessages();

    try {
      const response = await fetch("/api/agent/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappingForm),
      });

      const data = (await response.json()) as CreateErrorResponse;
      if (!response.ok) {
        throw new Error(extractCreateError(data));
      }

      setCreateMessage(`Mapping ${mappingForm.namaste_code} -> ${mappingForm.icd11_code} added.`);
      setMappingForm({
        namaste_code: "",
        icd11_code: "",
        confidence: "70",
        status: "pending",
        mappingCount: "1",
      });
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Failed to create mapping");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-xl">
      <div className="bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(59,130,246,0.05))]">
        <CardHeader className="gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Goal-Based Code Mapper Agent
          </div>
          <div>
            <CardTitle className="text-2xl">Find the best ICD-11 match from symptoms or NAMASTE input</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
              This planner agent parses the query, searches MongoDB NAMASTE codes, scores candidates,
              cross-checks ICD-11 mappings, and returns the top ranked matches with reasoning.
            </CardDescription>
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-6 pt-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_220px_auto]" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="agent-query">Describe symptoms or enter NAMASTE code</Label>
            <Input
              id="agent-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: burning sensation, fatigue, AYR-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-category">Category</Label>
            <select
              id="agent-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as "" | AgentCategory)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button className="w-full gap-2 lg:w-auto" disabled={loading} type="submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
              Find Match
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {(results.length > 0 || apiSuggestions.length > 0) && (
          <div className="grid gap-4">
            {results.length > 0 && (
              <div className="flex justify-end">
                <Badge variant={aiUsed ? "default" : "outline"}>
                  {aiUsed ? "AI-refined" : "Rule-based fallback"}
                </Badge>
              </div>
            )}

            {aiMessage && (
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {aiMessage}
              </div>
            )}

            {results.length > 0 && (
              <>
                {results.map((result) => (
                  <div
                    key={`${result.namaste_code}-${result.icd11_code ?? "none"}`}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline">{result.namaste_code}</Badge>
                          <span className="font-semibold text-foreground">{result.namaste_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {result.icd11_code ?? "No ICD-11 code"}
                          </span>
                          <span>{result.icd11_name ?? "Mapping pending or missing"}</span>
                        </div>

                        <p className="text-sm leading-6 text-muted-foreground">{result.reasoning}</p>

                        {result.symptoms && result.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-semibold text-muted-foreground my-auto">Symptoms:</span>
                            {result.symptoms.map(sym => (
                              <Badge key={sym} variant="secondary" className="text-xs bg-primary/10 border-primary/20">{sym}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="min-w-[210px] space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Confidence</span>
                          <span className="font-semibold">{result.confidence}%</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", getConfidenceTone(result.confidence))}
                            style={{ width: `${Math.max(result.confidence, 4)}%` }}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Badge variant={getStatusVariant(result.status)} className="capitalize">
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {apiSuggestions.length > 0 && (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">Possible Codes From API</h3>
                  <Badge variant="secondary">Not stored in MongoDB</Badge>
                </div>

                {apiSuggestionMessage && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {apiSuggestionMessage}
                  </div>
                )}

                {apiSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.namaste_code ?? "api"}-${suggestion.icd11_code ?? "none"}-${index}`}
                    className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline">{suggestion.namaste_code ?? "Code not available"}</Badge>
                          <span className="font-semibold text-foreground">{suggestion.namaste_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {suggestion.icd11_code ?? "ICD-11 code not available"}
                          </span>
                          <span>{suggestion.icd11_name ?? "Possible ICD-11 match"}</span>
                        </div>

                        <p className="text-sm leading-6 text-muted-foreground">{suggestion.reasoning}</p>

                        {suggestion.symptoms && suggestion.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-semibold text-amber-800/60 my-auto">Symptoms:</span>
                            {suggestion.symptoms.map(sym => (
                              <Badge key={sym} variant="secondary" className="text-xs bg-amber-500/20 border-amber-500/30 text-amber-900">{sym}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="min-w-[210px] space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Confidence</span>
                          <span className="font-semibold">{suggestion.confidence}%</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white/70">
                          <div
                            className={cn("h-full rounded-full transition-all", getConfidenceTone(suggestion.confidence))}
                            style={{ width: `${Math.max(suggestion.confidence, 4)}%` }}
                          />
                        </div>

                      <div className="flex justify-end">
                          <Badge variant="outline">
                            {suggestion.storedInMongo ? "Already in MongoDB" : "Review before saving"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedSuggestion(suggestion)}>
                        View Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={storageLoading || suggestion.storedInMongo}
                        onClick={() => void handleQuickStoreSuggestion(suggestion)}
                      >
                        {suggestion.storedInMongo ? "Already Stored" : storageLoading ? "Saving..." : "Add To Storage"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {storageDraft && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Add Suggested Code To Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Review the suggested fields before saving them into MongoDB.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStorageDraft(null)}>
                Close
              </Button>
            </div>

            {storageError && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {storageError}
              </div>
            )}

            {storageMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
                {storageMessage}
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleStoreSuggestion}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="suggested-namaste-code">NAMASTE code</Label>
                  <Input
                    id="suggested-namaste-code"
                    value={storageDraft.namaste_code}
                    onChange={(event) =>
                      setStorageDraft((current) => (current ? { ...current, namaste_code: event.target.value } : current))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggested-category">Category</Label>
                  <select
                    id="suggested-category"
                    value={storageDraft.category}
                    onChange={(event) =>
                      setStorageDraft((current) =>
                        current ? { ...current, category: event.target.value as AgentCategory } : current,
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Ayurveda">Ayurveda</option>
                    <option value="Siddha">Siddha</option>
                    <option value="Unani">Unani</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested-namaste-name">NAMASTE name</Label>
                <Input
                  id="suggested-namaste-name"
                  value={storageDraft.namaste_name}
                  onChange={(event) =>
                    setStorageDraft((current) => (current ? { ...current, namaste_name: event.target.value } : current))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="suggested-icd-code">ICD-11 code</Label>
                  <Input
                    id="suggested-icd-code"
                    value={storageDraft.icd11_code}
                    onChange={(event) =>
                      setStorageDraft((current) => (current ? { ...current, icd11_code: event.target.value } : current))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggested-icd-name">ICD-11 name</Label>
                  <Input
                    id="suggested-icd-name"
                    value={storageDraft.icd11_name}
                    onChange={(event) =>
                      setStorageDraft((current) => (current ? { ...current, icd11_name: event.target.value } : current))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested-symptoms">Symptoms</Label>
                <Input
                  id="suggested-symptoms"
                  value={storageDraft.symptoms}
                  onChange={(event) =>
                    setStorageDraft((current) => (current ? { ...current, symptoms: event.target.value } : current))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested-description">Description</Label>
                <Textarea
                  id="suggested-description"
                  value={storageDraft.description}
                  onChange={(event) =>
                    setStorageDraft((current) => (current ? { ...current, description: event.target.value } : current))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested-status">Status</Label>
                <select
                  id="suggested-status"
                  value={storageDraft.status}
                  onChange={(event) =>
                    setStorageDraft((current) =>
                      current ? { ...current, status: event.target.value as "verified" | "pending" } : current,
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button disabled={storageLoading} type="submit" className="gap-2">
                  {storageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Save To MongoDB
                </Button>
              </div>
            </form>
          </div>
        )}

        {!loading && !error && results.length === 0 && apiSuggestions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            The agent will return up to three MongoDB matches first. If nothing stored matches well, it will also show possible API-generated codes that are not stored in MongoDB.
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-muted/10 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5 text-primary" />
                Add Mongo code data
              </h3>
              <p className="text-sm text-muted-foreground">
                Create NAMASTE codes, ICD-11 codes, and mappings used by the agent.
              </p>
            </div>

            <div className="inline-flex rounded-full bg-background p-1">
              <Button type="button" variant={createTab === "namaste" ? "default" : "ghost"} onClick={() => setCreateTab("namaste")}>
                NAMASTE
              </Button>
              <Button type="button" variant={createTab === "icd11" ? "default" : "ghost"} onClick={() => setCreateTab("icd11")}>
                ICD-11
              </Button>
              <Button type="button" variant={createTab === "mapping" ? "default" : "ghost"} onClick={() => setCreateTab("mapping")}>
                Mapping
              </Button>
            </div>
          </div>

          {createError && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {createError}
            </div>
          )}

          {createMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {createMessage}
            </div>
          )}

          {createTab === "namaste" && (
            <form className="grid gap-4" onSubmit={handleCreateNamaste}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="namaste-code">NAMASTE code</Label>
                  <Input
                    id="namaste-code"
                    value={namasteForm.code}
                    onChange={(event) => setNamasteForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="AYR-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaste-category">Category</Label>
                  <select
                    id="namaste-category"
                    value={namasteForm.category}
                    onChange={(event) =>
                      setNamasteForm((current) => ({ ...current, category: event.target.value as AgentCategory }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories
                      .filter((option) => option.value)
                      .map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaste-name">Name</Label>
                <Input
                  id="namaste-name"
                  value={namasteForm.name}
                  onChange={(event) => setNamasteForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Vata Vyadhi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaste-description">Description</Label>
                <Textarea
                  id="namaste-description"
                  value={namasteForm.description}
                  onChange={(event) => setNamasteForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe the condition, symptoms, and context."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaste-symptoms">Symptoms</Label>
                <Input
                  id="namaste-symptoms"
                  value={namasteForm.symptoms}
                  onChange={(event) => setNamasteForm((current) => ({ ...current, symptoms: event.target.value }))}
                  placeholder="fatigue, burning sensation, dryness"
                />
              </div>

              <div className="flex justify-end">
                <Button disabled={createLoading} type="submit" className="gap-2">
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Add NAMASTE Code
                </Button>
              </div>
            </form>
          )}

          {createTab === "icd11" && (
            <form className="grid gap-4" onSubmit={handleCreateIcd11}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="icd11-code">ICD-11 code</Label>
                  <Input
                    id="icd11-code"
                    value={icd11Form.code}
                    onChange={(event) => setIcd11Form((current) => ({ ...current, code: event.target.value }))}
                    placeholder="MG30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icd11-chapter">Chapter</Label>
                  <Input
                    id="icd11-chapter"
                    value={icd11Form.chapter}
                    onChange={(event) => setIcd11Form((current) => ({ ...current, chapter: event.target.value }))}
                    placeholder="Diseases of the digestive system"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icd11-name">Name</Label>
                <Input
                  id="icd11-name"
                  value={icd11Form.name}
                  onChange={(event) => setIcd11Form((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Functional dyspepsia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icd11-description">Description</Label>
                <Textarea
                  id="icd11-description"
                  value={icd11Form.description}
                  onChange={(event) => setIcd11Form((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe the ICD-11 code in clinical terms."
                />
              </div>

              <div className="flex justify-end">
                <Button disabled={createLoading} type="submit" className="gap-2">
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Add ICD-11 Code
                </Button>
              </div>
            </form>
          )}

          {createTab === "mapping" && (
            <form className="grid gap-4" onSubmit={handleCreateMapping}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mapping-namaste">NAMASTE code</Label>
                  <Input
                    id="mapping-namaste"
                    value={mappingForm.namaste_code}
                    onChange={(event) =>
                      setMappingForm((current) => ({ ...current, namaste_code: event.target.value }))
                    }
                    placeholder="AYR-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapping-icd11">ICD-11 code</Label>
                  <Input
                    id="mapping-icd11"
                    value={mappingForm.icd11_code}
                    onChange={(event) =>
                      setMappingForm((current) => ({ ...current, icd11_code: event.target.value }))
                    }
                    placeholder="MG30"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="mapping-confidence">Confidence</Label>
                  <Input
                    id="mapping-confidence"
                    type="number"
                    min="0"
                    max="100"
                    value={mappingForm.confidence}
                    onChange={(event) =>
                      setMappingForm((current) => ({ ...current, confidence: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mapping-count">Mapping count</Label>
                  <Input
                    id="mapping-count"
                    type="number"
                    min="0"
                    value={mappingForm.mappingCount}
                    onChange={(event) =>
                      setMappingForm((current) => ({ ...current, mappingCount: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mapping-status">Status</Label>
                  <select
                    id="mapping-status"
                    value={mappingForm.status}
                    onChange={(event) =>
                      setMappingForm((current) => ({
                        ...current,
                        status: event.target.value as "verified" | "pending",
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={createLoading} type="submit" className="gap-2">
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Add Mapping
                </Button>
              </div>
            </form>
          )}
        </div>

        {selectedSuggestion && (
          <Modal title={selectedSuggestion.namaste_name || selectedSuggestion.namaste_code || "Suggested code"} onClose={() => setSelectedSuggestion(null)}>
            <div className="max-h-[85vh] overflow-y-auto pr-2">
              <div className="flex flex-col gap-4 text-sm">
                <p><strong>NAMASTE Code:</strong> {selectedSuggestion.namaste_code ?? "Not available"}</p>
                <p><strong>NAMASTE Name:</strong> {selectedSuggestion.namaste_name}</p>
                <p><strong>ICD-11 Code:</strong> {selectedSuggestion.icd11_code ?? "Not available"}</p>
                <p><strong>ICD-11 Name:</strong> {selectedSuggestion.icd11_name ?? "Not available"}</p>
                <p><strong>Category:</strong> {selectedSuggestion.category ?? "Not available"}</p>
                <p><strong>Symptoms:</strong> {selectedSuggestion.symptoms.length ? selectedSuggestion.symptoms.join(", ") : "Not available"}</p>
                <p><strong>Description:</strong> {selectedSuggestion.description ?? "Not available"}</p>
                <p>
                  <strong>Status:</strong> {selectedSuggestion.storedInMongo ? "Already stored in MongoDB" : "Suggested only, not stored in MongoDB"}
                </p>
                <p><strong>Chapter:</strong> {selectedSuggestion.chapter ?? "Not available"}</p>
                <p><strong>Reasoning:</strong> {selectedSuggestion.reasoning}</p>

                <div className="mt-2">
                  <Pie
                    data={getSuggestionChartData(selectedSuggestion)}
                    options={{
                      plugins: {
                        legend: { position: "bottom" },
                      },
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedSuggestion(null)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    disabled={selectedSuggestion.storedInMongo}
                    onClick={() => {
                      void handleQuickStoreSuggestion(selectedSuggestion);
                    }}
                  >
                    {selectedSuggestion.storedInMongo ? "Already Stored" : "Add To Storage"}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </CardContent>
    </Card>
  );
}
