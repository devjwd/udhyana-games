"use me";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { Menu, X, ExternalLink, MapPin, Gamepad2, ShoppingBag, ShieldCheck } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#07090c]/90 backdrop-blur-md border-b border-[#1f2735] py-3 shadow-lg"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Logo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white flex items-center gap-1.5">
                UDHYANA <span className="text-[#39FF14] neon-text-glow">GAMES</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                Matta Lounge • Swat
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#experience"
              className="text-sm font-medium text-slate-300 hover:text-[#39FF14] transition-colors flex items-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-[#39FF14]" />
              The Lounge
            </a>
            <a
              href="#retail"
              className="text-sm font-medium text-slate-300 hover:text-[#39FF14] transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-[#39FF14]" />
              Gear & Retail
            </a>
            <a
              href="#location"
              className="text-sm font-medium text-slate-300 hover:text-[#39FF14] transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-[#39FF14]" />
              Matta Location
            </a>
            
            {/* Main Domain Link */}
            <a
              href="https://udhyana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-1"
            >
              udhyana.com <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="#location"
              className="neon-glow-btn px-5 py-2.5 rounded-lg text-sm tracking-wide uppercase font-bold"
            >
              Visit Lounge
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-[#39FF14] p-2 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-7 h-7 text-[#39FF14]" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f1319]/95 backdrop-blur-xl border-b border-[#1f2735] px-4 pt-4 pb-6 mt-3 space-y-4 shadow-2xl">
          <a
            href="#experience"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-base font-medium text-slate-200 hover:text-[#39FF14] py-2 border-b border-slate-800/60"
          >
            <Gamepad2 className="w-5 h-5 text-[#39FF14]" />
            The Lounge Experience
          </a>
          <a
            href="#retail"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-base font-medium text-slate-200 hover:text-[#39FF14] py-2 border-b border-slate-800/60"
          >
            <ShoppingBag className="w-5 h-5 text-[#39FF14]" />
            Gaming Accessories Retail
          </a>
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-base font-medium text-slate-200 hover:text-[#39FF14] py-2 border-b border-slate-800/60"
          >
            <MapPin className="w-5 h-5 text-[#39FF14]" />
            Matta Swat Location & Hours
          </a>
          <a
            href="https://udhyana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sm text-slate-400 py-2"
          >
            <span>Back to main brand hub (udhyana.com)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <div className="pt-2">
            <a
              href="#location"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center neon-glow-btn py-3 rounded-lg text-sm tracking-wide uppercase font-bold"
            >
              Visit Lounge Matta
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
