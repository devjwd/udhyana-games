import React from "react";
import { ShieldCheck, Wind, Gamepad, Sparkles, Monitor, Users, Zap, Award } from "lucide-react";

export function ExperienceSection() {
  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#39FF14]" />,
      title: "100% Smoke-Free Environment",
      description:
        "Designed specifically as a clean, family-friendly commercial gamezone where gamers of all ages can play in comfort and safety.",
      badge: "Family Safe",
    },
    {
      icon: <Wind className="w-8 h-8 text-[#39FF14]" />,
      title: "Standalone Cooling Units",
      description:
        "No hot booths! Dedicated AC units per lounge sector ensure optimal temperature control even during high-octane gaming sessions.",
      badge: "Climate Controlled",
    },
    {
      icon: <Monitor className="w-8 h-8 text-[#39FF14]" />,
      title: "Pro Console Stations",
      description:
        "High-end PlayStation 5 & Xbox Series X consoles hooked up to ultra-low latency 4K HDR displays with high refresh rates.",
      badge: "4K HDR 120Hz",
    },
    {
      icon: <Gamepad className="w-8 h-8 text-[#39FF14]" />,
      title: "Ergonomic Setup & Recliners",
      description:
        "Pro seating built for endurance with adjustable lumbar support and spacious gaming stations tailored for multiplayer groups.",
      badge: "Ultra Comfort",
    },
    {
      icon: <Zap className="w-8 h-8 text-[#39FF14]" />,
      title: "Dedicated Fiber Line",
      description:
        "Zero-lag low ping multiplayer gaming connected directly to high-speed optical fiber infrastructure in Matta, Swat.",
      badge: "Low Ping",
    },
    {
      icon: <Award className="w-8 h-8 text-[#39FF14]" />,
      title: "Tournament Ready",
      description:
        "Regular local eSports tournaments for FC24/FIFA, Tekken 8, Call of Duty, and Fortnite with prizes and leaderboard tracking.",
      badge: "Compete & Win",
    },
  ];

  return (
    <section id="experience" className="py-24 bg-[#07090c] relative border-t border-[#1f2735]">
      {/* Background Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#39FF14 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-xs font-bold text-[#39FF14] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Premium Standard
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            THE UDHYANA <span className="text-[#39FF14]">EXPERIENCE</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            We built Udhyana Games to redefine what a local commercial gamezone should be. Modern, comfortable, safe, and relentlessly high performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0f1319] border border-[#1f2735] hover:border-[#39FF14]/60 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(57,255,20,0.15)] group relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Card Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-[#07090c] border border-[#1f2735] rounded-xl group-hover:border-[#39FF14]/40 transition-colors">
                  {item.icon}
                </div>
                <span className="text-[11px] font-bold text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {item.badge}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-[#39FF14] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Accent Corner highlight */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#39FF14]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Atmosphere Highlight Banner */}
        <div className="mt-16 bg-gradient-to-r from-[#0f1319] via-[#141922] to-[#0f1319] border border-[#39FF14]/30 rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
              <Users className="w-6 h-6 text-[#39FF14]" /> Designed For Everyone
            </h3>
            <p className="text-slate-300 text-sm max-w-2xl">
              Whether you are looking for solo ranked play, FIFA tournaments with friends, or bringing family members to enjoy games in a clean space — Udhyana Games delivers.
            </p>
          </div>
          <a
            href="#location"
            className="neon-glow-btn px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider shrink-0"
          >
            Locate Us in Matta
          </a>
        </div>

      </div>
    </section>
  );
}
