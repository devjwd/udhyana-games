import React from "react";
import Metadata from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ExperienceSection } from "@/components/ExperienceSection";
import { RetailSection } from "@/components/RetailSection";
import { LocationSection } from "@/components/LocationSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07090c] text-white selection:bg-[#39FF14] selection:text-[#07090c]">
      {/* Sticky Header Navigation */}
      <Header />

      {/* Main Content Sections */}
      <main>
        <Hero />
        <ExperienceSection />
        <RetailSection />
        <LocationSection />
      </main>

      {/* Footer Navigation & Credits */}
      <Footer />
    </div>
  );
}
