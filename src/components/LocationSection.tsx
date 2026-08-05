import React from "react";
import { MapPin, Clock, Phone, MessageSquare, ExternalLink, Navigation, Compass, ShieldCheck } from "lucide-react";

export function LocationSection() {
  return (
    <section id="location" className="py-24 bg-[#07090c] relative border-t border-[#1f2735]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-xs font-bold text-[#39FF14] uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" /> Matta, Swat Lounge Location
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            VISIT THE <span className="text-[#39FF14]">LOUNGE</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Located right in the heart of Matta, Swat. Stop by for casual gaming, squad battles, or to pick up premium gaming accessories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Contact & Venue Information */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Address Card */}
            <div className="bg-[#0f1319] border border-[#1f2735] p-6 rounded-2xl space-y-4 hover:border-[#39FF14]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#39FF14]/10 text-[#39FF14]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Main Lounge Address</h3>
                  <p className="text-xs text-slate-400">Matta Commercial Hub</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                Udhyana Games Lounge, 2nd Floor, Commercial Plaza, Main Bazaar Road, Matta, Swat Valley, Khyber Pakhtunkhwa.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://maps.google.com/?q=Matta+Swat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full neon-glow-btn py-2.5 rounded-lg text-xs tracking-wider uppercase font-bold text-center flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" /> Get Directions
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-[#0f1319] border border-[#1f2735] p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#39FF14]/10 text-[#39FF14]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Lounge Hours</h3>
                  <p className="text-xs text-slate-400">Open 7 Days a Week</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Monday – Thursday:</span>
                  <span className="font-bold text-white">10:00 AM – 11:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Friday (After Jummah):</span>
                  <span className="font-bold text-white">02:00 PM – 11:30 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-400">Saturday – Sunday:</span>
                  <span className="font-bold text-[#39FF14]">10:00 AM – 12:00 AM</span>
                </li>
              </ul>
            </div>

            {/* Quick Contact & WhatsApp */}
            <div className="bg-[#0f1319] border border-[#1f2735] p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#39FF14]/10 text-[#39FF14]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Desk & Inquiries</h3>
                  <p className="text-xs text-slate-400">Booth Bookings & Retail</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
                <a
                  href="tel:+923001234567"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#141922] border border-slate-700 hover:border-[#39FF14] text-xs font-bold text-white text-center flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#39FF14]" /> Call Desk
                </a>
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#39FF14] text-[#07090c] hover:bg-[#4dfa2c] text-xs font-bold text-center flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>

          </div>

          {/* Interactive Google Map Container */}
          <div className="lg:col-span-7 h-full min-h-[420px] rounded-2xl overflow-hidden border border-[#1f2735] shadow-2xl relative bg-[#0f1319]">
            <iframe
              title="Udhyana Games Lounge Matta Swat Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13146.4719041289!2d72.4089!3d34.9250!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dc2f90a9b83b3b%3A0x8898150ec6d1f971!2sMatta%2C%20Swat%2C%20Khyber%20Pakhtunkhwa!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "450px", filter: "invert(90%) hue-rotate(180deg) contrast(1.2)" }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[450px]"
            ></iframe>
            
            {/* Map Overlay Badge */}
            <div className="absolute bottom-4 left-4 p-3 rounded-xl glass-panel border border-[#39FF14]/30 text-xs text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-ping" />
              <span>Matta Bazaar Hub • Udhyana Games</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
