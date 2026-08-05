import React from "react";
import Image from "next/image";
import { Shield, Fan, Tv, Sparkles, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#07090c]">
      {/* Dynamic Background Glow Radial Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#39FF14]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Location & Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.15)] text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span>Matta, Swat&apos;s Flagship Gaming Destination</span>
              <span className="text-slate-500">•</span>
              <span className="text-[#39FF14]">Now Open</span>
            </div>

            {/* Tagline & Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                PLAY <span className="text-[#39FF14] neon-text-glow">ELEVATED</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Step into Matta&apos;s premier commercial gamezone. Next-gen console stations, zero smoke, dedicated chill cooling units, and high-end pro gaming gear.
              </p>
            </div>

            {/* Key Value Pill Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="p-3 rounded-xl bg-[#0f1319]/80 border border-[#1f2735] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Smoke-Free</div>
                  <div className="text-[11px] text-slate-400">Family Atmosphere</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f1319]/80 border border-[#1f2735] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14]">
                  <Fan className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Direct AC</div>
                  <div className="text-[11px] text-slate-400">Individual Cooling</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f1319]/80 border border-[#1f2735] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14]">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">4K 120Hz</div>
                  <div className="text-[11px] text-slate-400">Pro Gaming Booths</div>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#location"
                className="w-full sm:w-auto neon-glow-btn px-8 py-4 rounded-xl text-base font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 group"
              >
                <span>Visit the Lounge</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#retail"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white glass-panel hover:border-[#39FF14]/50 transition-all flex items-center justify-center gap-2"
              >
                <span>View Gear & Accessories</span>
              </a>
            </div>

            {/* Micro Details */}
            <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#39FF14]" /> PS5 & Xbox Series X
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#39FF14]" /> High-Speed Fiber Net
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#39FF14]" /> Matta Swat
              </span>
            </div>

          </div>

          {/* Hero Visual Card / Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#39FF14]/30 shadow-[0_0_40px_rgba(57,255,20,0.25)] group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/hero-lounge.png"
                  alt="Udhyana Games Lounge Matta Swat"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090c] via-transparent to-transparent opacity-80" />
              </div>

              {/* Floating Badge on Image */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Udhyana Gaming Lounge</h4>
                  <p className="text-xs text-slate-300">Matta, Swat Valley</p>
                </div>
                <div className="px-3 py-1 bg-[#39FF14] text-[#07090c] font-black text-xs rounded uppercase tracking-wider">
                  Premium
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
