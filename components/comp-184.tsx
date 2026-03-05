"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useId, useState, useEffect } from "react";  // ← add useEffect

import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";

export default function ModeToggle() {
  const id = useId();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and first client paint: render neutral/placeholder (matches server)
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative inline-grid h-6 w-15 grid-cols-[1fr_1fr] items-center font-medium text-sm">
          {/* Placeholder that looks like unchecked switch – adjust opacity or hide icons if needed */}
          <Switch
            checked={false}
            className="peer [&_span]:data-[state=checked]:rtl:-translate-x-full absolute inset-0 h-[inherit] w-auto data-[state=unchecked]:bg-input/50 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full"
            id={id}
            disabled  // optional: prevent interaction during placeholder
          />
          <span className="pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center">
            <MoonIcon aria-hidden="true" size={16} />
          </span>
          <span className="pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center">
            <SunIcon aria-hidden="true" size={16} />
          </span>
        </div>
      </div>
    );
  }

  // Now safe: real theme is known
  const isDark = theme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-grid h-6 w-15 grid-cols-[1fr_1fr] items-center font-medium text-sm">
        <Switch
          checked={isDark}
          onCheckedChange={handleToggle}
          className="peer [&_span]:data-[state=checked]:rtl:-translate-x-full absolute inset-0 h-[inherit] w-auto data-[state=unchecked]:bg-input/50 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full"
          id={id}
        />
        <span className="peer-data-[state=unchecked]:rtl:-translate-x-full pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full">
          <MoonIcon aria-hidden="true" size={16} />
        </span>
        <span className="peer-data-[state=checked]:-translate-x-full pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=unchecked]:invisible peer-data-[state=checked]:text-background peer-data-[state=checked]:rtl:translate-x-full">
          <SunIcon aria-hidden="true" size={16} />
        </span>
      </div>
    </div>
  );
}