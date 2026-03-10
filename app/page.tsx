"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import DotGrid from "@/components/DotGrid";
import { motion } from "framer-motion";
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05070a] text-white overflow-hidden selection:bg-brand-accent/30">
      {/* Background animation layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#1e293b"
          activeColor="#0ea5e9"
          proximity={120}
          shockStrength={8} style={undefined}        />
      </div>

      {/* Atmospheric Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-accent/20">
            <Activity size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight">
            INDIREX <span className="text-brand-accent font-normal">[router]</span>
          </span>
        </div>
        
  

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
          </Button>
        </div>
      </nav>

      {/* Hero section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-7xl mx-auto w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-10"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-semibold uppercase tracking-wider">
            <Zap size={12} fill="currentColor" />
            <span>Now with real-time analytics</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] max-w-4xl mx-auto"
          >
            Monitor your <span className="text-brand-accent">Device</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Indirex Router Meter
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
          </motion.div>

          {/* Feature Grid */}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-10 px-8 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Activity size={18} />
            <span className="font-bold text-sm tracking-tight">INDIREX</span>
          </div>
          
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Indirex Router Meter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
