"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: This API call will fail if the server is not running on port 4000.
      // For the demo, we'll simulate a successful login if the API fails.
      const res = await fetch("https://api-router-dev.indirex.io/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Login failed", {
          description: data.error || "Invalid email or password",
          duration: 4000,
        });
        return;
      }

      toast.success("Login successful", {
        description: "Welcome back!",
        duration: 3000,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      // Fallback for demo purposes if the local server isn't running
      if (email === "demo@example.com" && password === "password") {
        toast.success("Demo Login successful", {
          description: "Welcome back to the dashboard!",
          duration: 3000,
        });
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("user", JSON.stringify({ name: "Demo User", email: "demo@example.com" }));
        router.push("/dashboard");
        return;
      }

      toast.error("Error", {
        description: err.message || "Invalid email or password",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Login to your account</h1>
        <p className="text-brand-muted text-sm leading-relaxed">
          Enter your email below to login to your account
        </p>
      </div>

      <FieldGroup>
        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
            disabled={loading}
            autoComplete="email"
            className="h-12 rounded-xl bg-brand-card border-brand-border focus:border-brand-accent transition-all"
          />
        </Field>

        {/* Password with toggle */}
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="#" className="text-xs text-brand-accent hover:underline">Forgot password?</Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="h-12 rounded-xl bg-brand-card border-brand-border focus:border-brand-accent pr-12 transition-all"
              placeholder="••••••••"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-brand-muted hover:text-brand-text hover:bg-transparent"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Field>

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-brand-accent/20" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </FieldGroup>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-brand-bg px-4 text-brand-muted font-medium tracking-wider">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-12 rounded-xl border-brand-border hover:bg-brand-card transition-colors">
          Google
        </Button>
        <Button variant="outline" className="h-12 rounded-xl border-brand-border hover:bg-brand-card transition-colors">
          GitHub
        </Button>
      </div>
    </form>
  );
}

