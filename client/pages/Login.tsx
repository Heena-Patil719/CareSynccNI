import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Activity, Briefcase, Building2, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMongoAuth } from "@/hooks/useMongoAuth";
import { useAuth } from "@/contexts/AuthContext";
import type { MongoUser } from "@/lib/mongoAuth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || value.length >= 7, "Phone number is too short");

const optionalTextSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.length >= 2, `${fieldName} is too short`);

const signupSchema = loginSchema.extend({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phoneNumber: optionalPhoneSchema,
  organization: optionalTextSchema("Organization"),
  jobTitle: optionalTextSchema("Job title"),
});

type FieldErrors = Partial<
  Record<"email" | "password" | "firstName" | "lastName" | "phoneNumber" | "organization" | "jobTitle" | "form", string>
>;

function mapRoleForApp(user: MongoUser): "admin" | "user" {
  return user.role === "admin" ? "admin" : "user";
}

const benefits = [
  {
    icon: ShieldCheck,
    title: "Secure access",
    text: "Mongo-backed login with hashed passwords and persistent sessions.",
  },
  {
    icon: Building2,
    title: "Team-ready profiles",
    text: "Save your organization, role context, and contact details for later workflows.",
  },
  {
    icon: Activity,
    title: "Faster onboarding",
    text: "One clean auth path for CareSync instead of mixed OTP and parallel screens.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, login, signup, loading, error } = useMongoAuth();
  const { manualLogin } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    organization: "",
    jobTitle: "",
    password: "",
  });

  useEffect(() => {
    if (!hasSubmitted && !loading && user) {
      completeLogin(user);
    }
  }, [hasSubmitted, loading, user]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = (): boolean => {
    if (mode === "login") {
      const result = loginSchema.safeParse(formData);

      if (result.success) {
        setFieldErrors({});
        return true;
      }

      const flattened = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });
      return false;
    }

    const result = signupSchema.safeParse(formData);

    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const flattened = result.error.flatten().fieldErrors;
    setFieldErrors({
      email: flattened.email?.[0],
      password: flattened.password?.[0],
      firstName: flattened.firstName?.[0],
      lastName: flattened.lastName?.[0],
      phoneNumber: flattened.phoneNumber?.[0],
      organization: flattened.organization?.[0],
      jobTitle: flattened.jobTitle?.[0],
    });
    return false;
  };

  const completeLogin = (signedInUser: MongoUser) => {
    manualLogin({
      id: signedInUser.id,
      email: signedInUser.email,
      firstName: signedInUser.firstName,
      lastName: signedInUser.lastName,
      role: mapRoleForApp(signedInUser),
    });
    navigate("/dashboard");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setHasSubmitted(true);

      if (mode === "login") {
        const signedInUser = await login(formData.email, formData.password);
        completeLogin(signedInUser);
        return;
      }

      const signedInUser = await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.organization,
        formData.jobTitle,
      );

      completeLogin(signedInUser);
    } catch (submitError) {
      setHasSubmitted(false);
      const message = submitError instanceof Error ? submitError.message : error ?? "Request failed";
      setFieldErrors((current) => ({ ...current, form: message }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,_rgba(14,165,233,0.06),_rgba(15,23,42,0.02))]">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-[2rem] border border-border/60 bg-background/75 p-8 shadow-2xl backdrop-blur md:p-10">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Unified CareSync access
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {mode === "login" ? "Sign in and continue your care workflow." : "Create a profile that your team can reuse."}
              </h1>
              <p className="text-base leading-7 text-muted-foreground md:text-lg">
                This refreshed auth flow stores only the account details that help with real use later:
                identity, role, contact information, and organization context.
              </p>
            </div>

            <div className="grid gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/40 p-4"
                  >
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="font-semibold text-foreground">{benefit.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">{benefit.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <Card className="border-border/70 bg-background/95 shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="inline-flex rounded-full bg-muted p-1">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                onClick={() => {
                  setMode("login");
                  setFieldErrors({});
                }}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "ghost"}
                onClick={() => {
                  setMode("signup");
                  setFieldErrors({});
                }}
              >
                Create Account
              </Button>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-3xl">
                {mode === "login" ? "Welcome back" : "Set up your account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Use your email and password to access CareSync."
                  : "We will save the details that are useful for future team workflows."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(event) => handleChange("firstName", event.target.value)}
                        placeholder="Heena"
                      />
                      {fieldErrors.firstName && (
                        <p className="text-sm text-destructive">{fieldErrors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(event) => handleChange("lastName", event.target.value)}
                        placeholder="Patil"
                      />
                      {fieldErrors.lastName && (
                        <p className="text-sm text-destructive">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phoneNumber"
                          className="pl-10"
                          value={formData.phoneNumber}
                          onChange={(event) => handleChange("phoneNumber", event.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {fieldErrors.phoneNumber && (
                        <p className="text-sm text-destructive">{fieldErrors.phoneNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job title</Label>
                      <div className="relative">
                        <Briefcase className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="jobTitle"
                          className="pl-10"
                          value={formData.jobTitle}
                          onChange={(event) => handleChange("jobTitle", event.target.value)}
                          placeholder="Care Coordinator"
                        />
                      </div>
                      {fieldErrors.jobTitle && (
                        <p className="text-sm text-destructive">{fieldErrors.jobTitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organization"
                        className="pl-10"
                        value={formData.organization}
                        onChange={(event) => handleChange("organization", event.target.value)}
                        placeholder="CareSync Hospital or Clinic"
                      />
                    </div>
                    {fieldErrors.organization && (
                      <p className="text-sm text-destructive">{fieldErrors.organization}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="At least 8 characters"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              {(fieldErrors.form || error) && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {fieldErrors.form ?? error}
                </p>
              )}

              <Button className="h-11 w-full text-base" disabled={loading} type="submit">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign In to CareSync" : "Create CareSync Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
