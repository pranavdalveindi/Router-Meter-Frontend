"use client";

import { Activity, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-brand-bg text-brand-text">
      {/* Left side: Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 relative z-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium hover:text-brand-accent transition-colors group">
            <div className="bg-brand-accent text-white flex size-8 items-center justify-center rounded-lg shadow-lg shadow-brand-accent/20 group-hover:scale-110 transition-transform">
              <Activity className="size-5" />
            </div>
            <span className="text-lg tracking-tight font-bold">
              INDIREX <span className="text-brand-accent font-normal">[router]</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <LoginForm />
            
            <p className="mt-8 text-center text-sm text-brand-muted">
              Don't have an account? <Link href="#" className="text-brand-accent hover:underline">Sign up</Link>
            </p>
          </motion.div>
        </div>

        <div className="mt-auto pt-8 text-center md:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>

      {/* Right side: Image/Atmosphere */}
      <div className="relative hidden lg:block overflow-hidden border-l border-brand-border">
        <div className="absolute inset-0 z-0">
          <img
            src=""
            alt="Network Background"
            className="absolute inset-0 h-full w-full object-cover brightness-[0.15] dark:brightness-[0.15] light:brightness-[0.8] grayscale"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 via-transparent to-indigo-500/10" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-6 max-w-md"
          >
            <div className="inline-flex p-3 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent mb-4">
              <Activity size={32} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

