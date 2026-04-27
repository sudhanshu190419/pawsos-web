"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ShoppingBag, 
  Bell, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Heart,
  Store,
  ChevronRight,
  Target,
  Zap
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   COMING SOON - SHOP TEASER PAGE
   Designed by Antigravity (UI/UX Pro Max)
   ═══════════════════════════════════════════════════ */

export default function ShopComingSoon() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans selection:bg-primary/20 overflow-x-hidden">
      <GlobalStyles />

      {/* Premium Navigation Strip */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">PawsOS <span className="text-primary">Shop</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <a href="/report" className="hover:text-primary transition-colors">Active SOS</a>
          <a href="#" className="hover:text-primary transition-colors">Marketplace</a>
        </div>
        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-xl shadow-slate-200">
          Main Website
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[80vh] flex items-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-20 right-[-10%] w-[40%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-orange-200/20 blur-[100px] rounded-full" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">Beta Launch Winter 2026</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">Ultimate</span> Marketplace for Pets.
            </h1>
            
            <p className="text-lg text-slate-500 mb-10 max-w-xl leading-relaxed font-medium">
              We're building more than just a shop. A curated ecosystem of vet-verified supplies, life-saving tech, and community-driven rewards. Coming soon to your paws.
            </p>

            {/* Notification Form */}
            <AnimatePresence mode="wait">
              {!isSubscribed ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleNotify}
                  className="flex flex-col sm:flex-row gap-3 max-w-md"
                >
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                  />
                  <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                    Notify Me <Bell className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4 max-w-md"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-900 text-sm uppercase tracking-tight">You're on the list!</h4>
                    <p className="text-xs text-emerald-700/80 mt-1 font-medium">We'll ping you as soon as the doors open.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column: Visual Teaser (Resized) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.06)] border-[8px] border-white w-full max-w-[360px] aspect-[4/5] lg:aspect-[3/4] max-h-[50vh]">
              <img 
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800" 
                alt="Shop Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Sparkles className="w-5 h-5 text-orange-200" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Coming Soon</div>
                    <div className="text-base font-black tracking-tight">Exclusive Early Access</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100/50 rounded-full blur-[40px] -z-10" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-[50px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Feature Teasers */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">The PawsOS Difference</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Shopping with a <span className="italic font-display font-medium text-primary underline decoration-orange-200 underline-offset-8">Soul.</span></h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Vet-Verified Only",
                desc: "Every single listing is reviewed by our panel of certified veterinarians to ensure safety and quality.",
                icon: ShieldCheck,
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Smart SOS Integration",
                desc: "Purchase essential medical supplies that automatically sync with your Active SOS emergency profile.",
                icon: Zap,
                color: "bg-orange-50 text-orange-600"
              },
              {
                title: "Community Rewards",
                desc: "Earn 'Karma Points' for every purchase, redeemable for emergency rescue funding and discounts.",
                icon: Heart,
                color: "bg-red-50 text-red-600"
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[3rem] bg-white border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skeleton Preview Teaser */}
      <section className="py-20 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-6 gap-4 p-4">
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="h-60 bg-white/20 rounded-3xl" />
             ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 py-20">
          <h3 className="text-3xl md:text-4xl font-black mb-8 leading-tight">Ready to transform how you <br/> care for your best friend?</h3>
          <button className="group relative px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-2xl">
            <span className="relative z-10 flex items-center gap-3">
              Join the 2,400+ already waiting <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight text-slate-400 uppercase">PawsOS Shop © 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;800&display=swap');
    
    :root {
      --primary: #9c3e23;
    }

    body {
      font-family: 'Manrope', sans-serif;
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    ::selection {
      background: #9c3e23;
      color: white;
    }
  `}</style>
);
