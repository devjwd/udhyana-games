"use me";
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Star, Check, Tag, Sparkles, Filter, MessageCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: "controllers" | "headsets" | "keyboards" | "accessories";
  price: string;
  description: string;
  rating: number;
  inStock: boolean;
  tag?: string;
  image: string;
}

const products: Product[] = [
  {
    id: "p1",
    name: "DualSense Edge Wireless Controller",
    category: "controllers",
    price: "PKR 64,999",
    description: "Ultra-customizable PS5 pro controller with remappable buttons, tunable triggers & stick modules.",
    rating: 5.0,
    inStock: true,
    tag: "Top Seller",
    image: "/retail-gear.png",
  },
  {
    id: "p2",
    name: "Xbox Elite Wireless Series 2",
    category: "controllers",
    price: "PKR 54,500",
    description: "Designed for competitive performance with adjustable-tension thumbsticks and rubberized grip.",
    rating: 4.9,
    inStock: true,
    tag: "Popular",
    image: "/retail-gear.png",
  },
  {
    id: "p3",
    name: "SteelSeries Arctis Nova Pro Wireless",
    category: "headsets",
    price: "PKR 78,000",
    description: "Active Noise Cancellation, Dual Audio Streams & hot-swappable battery system.",
    rating: 4.8,
    inStock: true,
    tag: "Pro Audio",
    image: "/retail-gear.png",
  },
  {
    id: "p4",
    name: "Razer BlackWidow V4 Pro Mechanical",
    category: "keyboards",
    price: "PKR 46,000",
    description: "Green Mechanical Switches with Command Dial, dedicated macro keys & Underglow RGB.",
    rating: 4.9,
    inStock: true,
    tag: "RGB Pro",
    image: "/retail-gear.png",
  },
  {
    id: "p5",
    name: "HyperX Cloud III Wireless Headset",
    category: "headsets",
    price: "PKR 34,999",
    description: "Up to 120 hours battery life with signature HyperX memory foam comfort.",
    rating: 4.7,
    inStock: true,
    image: "/retail-gear.png",
  },
  {
    id: "p6",
    name: "Logitech G PRO X Superlight 2 Mouse",
    category: "accessories",
    price: "PKR 39,500",
    description: "60g ultra-lightweight esports gaming mouse with HERO 2 sensor and 95hr battery.",
    rating: 5.0,
    inStock: true,
    tag: "Esports Choice",
    image: "/retail-gear.png",
  },
];

export function RetailSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section id="retail" className="py-24 bg-[#0a0d12] relative border-t border-[#1f2735]">
      
      {/* Glow background accent */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#39FF14]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-xs font-bold text-[#39FF14] uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" /> Official On-Site Gear Store
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              RETAIL & <span className="text-[#39FF14]">ACCESSORIES</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl">
              Buy authentic high-end gaming accessories directly inside our Matta lounge. Tested by pros, backed by warranty.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0f1319] p-1.5 rounded-xl border border-[#1f2735]">
            {[
              { id: "all", label: "All Items" },
              { id: "controllers", label: "Controllers" },
              { id: "headsets", label: "Headsets" },
              { id: "keyboards", label: "Keyboards" },
              { id: "accessories", label: "Accessories" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#39FF14] text-[#07090c] shadow-[0_0_12px_rgba(57,255,20,0.5)]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="bg-[#0f1319] border border-[#1f2735] rounded-2xl overflow-hidden hover:border-[#39FF14]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(57,255,20,0.15)] flex flex-col justify-between group"
            >
              {/* Product Header / Image */}
              <div className="relative aspect-[16/10] bg-[#07090c] overflow-hidden p-6 flex items-center justify-center border-b border-[#1f2735]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                
                {/* Optional Tag Badge */}
                {item.tag && (
                  <span className="absolute top-3 left-3 bg-[#39FF14] text-[#07090c] text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-md">
                    {item.tag}
                  </span>
                )}

                <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0f1319]/80 backdrop-blur-md px-2 py-1 rounded text-xs text-amber-400 font-bold border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#39FF14] transition-colors leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">In-Store Price</div>
                    <div className="text-lg font-extrabold text-[#39FF14] tracking-tight">
                      {item.price}
                    </div>
                  </div>

                  <a
                    href="https://wa.me/923001234567?text=Hi%20Udhyana%20Games,%20I%20am%20interested%20in%20purchasing%20the%20gaming%20gear:"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#141922] border border-[#39FF14]/40 hover:bg-[#39FF14] hover:text-[#07090c] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Reserve Gear
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Custom Order / Accessories Note Banner */}
        <div className="mt-12 text-center bg-[#0f1319] border border-[#1f2735] rounded-xl p-6">
          <p className="text-sm text-slate-300">
            Looking for specific PC components, custom PS5 plates, or gaming monitors?{" "}
            <span className="text-[#39FF14] font-semibold">We accept custom orders at our Matta store desk.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
