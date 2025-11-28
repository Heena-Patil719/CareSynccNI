import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  Users,
  Settings,
  Shield,
  BarChart3,
  ArrowRight,
  GitBranch,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bridge Traditional & Modern Medicine
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Map NAMASTE (Ayurveda, Siddha, Unani) diagnosis codes to ICD-11 with
              our secure, FHIR-compliant platform.
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap animate-slide-up">
            <Button size="lg" onClick={() => navigate("/login")}>
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1000+</div>
              <p className="text-sm text-muted-foreground">Codes Mapped</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99%</div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Code Mapping",
                description: "Map NAMASTE codes to ICD-11 with confidence scores",
              },
              {
                icon: Users,
                title: "Patient Management",
                description: "Store and manage patient records with diagnoses",
              },
              {
                icon: Shield,
                title: "Security",
                description: "Role-based access control and secure authentication",
              },
              {
                icon: GitBranch,
                title: "FHIR Compliance",
                description: "Export patient data in FHIR JSON format",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Track mapping coverage and patient health trends",
              },
              {
                icon: Settings,
                title: "Admin Dashboard",
                description: "Manage codes, mappings, and user access",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { num: 1, title: "Sign Up", description: "Create your account" },
            { num: 2, title: "Search", description: "Find NAMASTE codes" },
            { num: 3, title: "Map", description: "Match to ICD-11 codes" },
            { num: 4, title: "Export", description: "Download FHIR JSON" },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground">
            Join hundreds of healthcare providers using Care Sync
          </p>
          <Button size="lg" onClick={() => navigate("/login")}>
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Care Sync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
