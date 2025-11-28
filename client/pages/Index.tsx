import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  Users,
  Shield,
  Zap,
  Search,
  Eye,
  BarChart3,
  Upload,
  Settings,
  Code,
  RefreshCw,
} from "lucide-react";

export default function Index() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-medium text-accent">
                FHIR-Compliant Healthcare Mapping
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
              Map Traditional Medicine to Modern Standards
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Care Sync seamlessly maps NAMASTE diagnosis codes (Ayurveda, Siddha,
              Unani) to ICD-11 with AI-assisted confidence scoring and secure FHIR
              compliance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/mapping">
                <Button size="lg" className="gap-2">
                  Start Mapping
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/patients">
                <Button size="lg" variant="outline" className="gap-2">
                  Patient Module
                  <Users className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
            Comprehensive Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code Mapping */}
            <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Code Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload NAMASTE code lists and automatically generate ICD-11 matches
                    with AI-powered confidence scores and manual verification options.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Search */}
            <div className="group p-6 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Search className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Find codes instantly by number, name, or keyword with intelligent
                    auto-complete suggestions and real-time filtering.
                  </p>
                </div>
              </div>
            </div>

            {/* Dual Viewer */}
            <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dual Viewer</h3>
                  <p className="text-sm text-muted-foreground">
                    View NAMASTE and ICD-11 code details side-by-side for better
                    comparison and understanding of mappings.
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Management */}
            <div className="group p-6 rounded-xl border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Patient Module</h3>
                  <p className="text-sm text-muted-foreground">
                    Create patient profiles, attach diagnoses, and export data as
                    FHIR-compliant JSON documents.
                  </p>
                </div>
              </div>
            </div>

            {/* FHIR API */}
            <div className="group p-6 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Code className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">FHIR-Compliant API</h3>
                  <p className="text-sm text-muted-foreground">
                    RESTful API endpoints for searching codes, managing patients, and
                    recording diagnoses with full FHIR compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Dashboard */}
            <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage codes, mappings, users, and track mapping coverage with
                    analytics and reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="group p-6 rounded-xl border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure login, role-based access control, JWT authentication, and
                    audit logging for compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Import/Export */}
            <div className="group p-6 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Import & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload code lists, export mappings, and sync data in standard
                    formats including CSV and JSON.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
            Streamlined Workflow
          </h2>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Upload Code Lists",
                desc: "Import NAMASTE codes from CSV or manual entry",
                icon: Upload,
              },
              {
                step: "2",
                title: "AI-Powered Mapping",
                desc: "Automatically match to ICD-11 with confidence scoring",
                icon: Zap,
              },
              {
                step: "3",
                title: "Review & Verify",
                desc: "Manually verify mappings and override when needed",
                icon: Eye,
              },
              {
                step: "4",
                title: "Patient Integration",
                desc: "Apply mappings to patient diagnoses and records",
                icon: Users,
              },
              {
                step: "5",
                title: "FHIR Export",
                desc: "Export patient data as FHIR-compliant JSON",
                icon: RefreshCw,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Icon className="w-5 h-5 text-muted-foreground hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Transform Healthcare Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start mapping codes and managing patients with Care Sync today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/mapping">
              <Button size="lg" className="min-w-fit">
                Access Code Mapping
              </Button>
            </Link>
            <Link to="/admin">
              <Button size="lg" variant="outline" className="min-w-fit">
                Admin Panel
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Enterprise security • FHIR-compliant • Role-based access • Real-time
            API
          </p>
        </div>
      </section>
    </>
  );
}
