import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { manualLogin } = useAuth();

  const API = "http://localhost:8080/api/auth";

  // ------------------ OTP TIMER ------------------ //
  useEffect(() => {
    if (!otpSent) return;
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // ------------------ CHECK EMAIL ------------------ //
  const checkEmail = async () => {
    const res = await fetch(`${API}/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.exists;
  };

  // ------------------ SEND OTP FOR SIGNUP ------------------ //
  const sendOtp = async () => {
    const res = await fetch(`${API}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    return await res.json();
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const exists = await checkEmail();
      if (exists) {
        toast({
          title: "Account already exists",
          description: "Please login instead",
        });
        setIsSignup(false);
        return;
      }

      await sendOtp();
      setOtpSent(true);
      setTimer(30);
      setCanResend(false);

      toast({ title: "OTP Sent", description: "Check your email inbox" });

    } catch {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ RESEND OTP ------------------ //
  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      await sendOtp();
      setTimer(30);
      setCanResend(false);

      toast({ title: "OTP Resent" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  // ------------------ VERIFY OTP (SIGNUP) ------------------ //
  const handleVerifyOtp = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save user inside Auth Context
      manualLogin({
        id: data?.user?._id || "",
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role || "user",
      });

      toast({ title: "Account Created" });
      navigate("/");

    } catch (err: any) {
      toast({
        title: "Invalid OTP",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ LOGIN WITH EMAIL + PASSWORD ONLY ------------------ //
  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.error || "Invalid credentials");

      manualLogin({
        id: data?.user?._id || "",
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role || "user",
      });

      toast({ title: "Login Successful" });
      navigate("/");

    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ SUBMIT FORM ------------------ //
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      otpSent ? handleVerifyOtp() : handleSignup();
    } else {
      handleLogin(); // LOGIN NEVER USES OTP
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold">
            {isSignup ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-center">
            {otpSent
              ? "Enter the OTP sent to your email"
              : isSignup
              ? "Register your account"
              : "Login to continue"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* SIGNUP FIELDS */}
            {isSignup && !otpSent && (
              <>
                <div>
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </>
            )}

            {/* EMAIL + PASSWORD */}
            {!otpSent && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* OTP INPUT */}
            {otpSent && (
              <div>
                <Label>Enter OTP</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} required />

                <div className="text-xs text-right mt-1">
                  {!canResend ? (
                    <span className="opacity-70">Resend in {timer}s</span>
                  ) : (
                    <button type="button" className="text-primary" onClick={handleResendOtp}>
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignup ? (otpSent ? "Verify OTP" : "Send OTP") : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-center mt-4">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              className="ml-2 text-primary font-semibold"
              onClick={() => {
                setIsSignup(!isSignup);
                setOtpSent(false);
              }}
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
