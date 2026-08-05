import React from "react";
import { Logo } from "./Logo";
import { MapPin, Phone, Clock, Mail, ShieldCheck, Heart, Sparkles, ExternalLink, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#07090c] border-t border-[#1f2735] pt-16 pb-12 relative overflow-hidden">
      {/* Glow highlight line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Bio */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Logo className="w-9 h-9" />
              <span className="font-extrabold text-xl tracking-wider text-white">
                UDHYANA <span className="text-[#39FF14]">GAMES</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Matta&apos;s premier physical gaming lounge. Experience elevated console gaming with high-end displays, standalone cooling, and a smoke-free family environment.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4" />
              100% Smoke-Free & Family Safe
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14]" /> Navigation
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#experience" className="hover:text-[#39FF14] transition-colors">
                  The Lounge Experience
                </a>
              </li>
              <li>
                <a href="#retail" className="hover:text-[#39FF14] transition-colors">
                  Gaming Accessories Retail
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-[#39FF14] transition-colors">
                  Matta Swat Location & Hours
                </a>
              </li>
              <li>
                <a
                  href="https://udhyana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#39FF14] transition-colors inline-flex items-center gap-1"
                >
                  Udhyana Main Domain <ExternalLink className="w-3 h-3 text-[#39FF14]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Location & Hours */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14]" /> Visit Us
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#39FF14] shrink-0 mt-0.5" />
                <span>Main Bazaar, Matta, Swat Valley, Khyber Pakhtunkhwa</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#39FF14] shrink-0" />
                <span>Open Daily: 10:00 AM – 11:30 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#39FF14] shrink-0" />
                <span>+92 (300) 123-4567</span>
              </li>
            </ul>
          </div>

          {/* Network Branches & Subdomain Context */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14]" /> Brand Network
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Part of the official Udhyana Network under <code className="text-[#39FF14] bg-[#0f1319] px-1.5 py-0.5 rounded">udhyana.com</code>
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#0f1319] border border-[#1f2735] rounded-lg flex justify-between items-center">
                <span className="text-slate-300 font-medium">Udhyana Games - Matta</span>
                <span className="text-[10px] bg-[#39FF14]/20 text-[#39FF14] font-bold px-2 py-0.5 rounded">
                  Active Lounge
                </span>
              </div>
              <div className="p-2.5 bg-[#0f1319] border border-[#1f2735]/60 rounded-lg flex justify-between items-center opacity-70">
                <span className="text-slate-400">Udhyana Network Hub</span>
                <span className="text-[10px] text-slate-500">udhyana.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1f2735] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Udhyana Games. All rights reserved. Matta, Swat.</p>
          <div className="flex items-center space-x-6">
            <span>Tagline: <strong className="text-slate-300">Play Elevated</strong></span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              Made for Swat Gamers <Heart className="w-3.5 h-3.5 text-[#39FF14]" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
