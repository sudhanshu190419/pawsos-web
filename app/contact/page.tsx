"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate an API call (You can replace this with Firebase or EmailJS later)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", topic: "General Inquiry", message: "" });
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16 sm:pb-24 selection:bg-orange-200 selection:text-orange-900">
      
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-20 pb-24 sm:pt-24 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[800px] h-[300px] sm:h-[400px] bg-orange-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-md text-orange-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 border border-white/10">
            <span>Get in Touch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            We'd love to hear from you.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed px-2 sm:px-0">
            Whether you're an NGO looking to partner, an investor, or just have a question about the AnimalSathi platform, our team is ready to help.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-20 mb-10">
        
        {/* EMERGENCY WARNING BANNER */}
        <div className="bg-red-50 border border-red-200 rounded-[1.5rem] sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row items-center gap-4 sm:gap-6 shadow-sm text-center md:text-left">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl shrink-0">
            🚨
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-black text-red-700 mb-1">Have an animal emergency?</h3>
            <p className="text-xs sm:text-sm text-red-600 font-medium">
              Do not use this form for live rescues. Please download the AnimalSathi app and tap "Send SOS" to alert volunteers within a 10km radius immediately.
            </p>
          </div>
          <Link 
            href="/download" 
            className="w-full md:w-auto shrink-0 bg-red-600 text-white px-6 py-3.5 sm:py-3 rounded-full font-bold text-sm sm:text-base hover:bg-red-700 transition-colors shadow-md hover:shadow-red-200 flex justify-center"
          >
            Get the App
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* LEFT COLUMN: CONTACT INFO */}
          <div className="md:col-span-1 space-y-4 sm:space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 border border-orange-100">✉️</div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 sm:mb-2">Email Us</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4">Our friendly team is here to help.</p>
              <a
  href="mailto:animalbuddiessociety@gmail.com"
  className="font-bold text-orange-600 text-xs sm:text-sm hover:text-orange-700 transition-colors break-all"
>
  animalbuddiessociety@gmail.com
</a>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 border border-blue-100">📍</div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 sm:mb-2">Headquarters</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4">Come say hello at our office.</p>
              <p className="font-bold text-slate-700 text-sm leading-relaxed">
                GL BAJAJ INSTITUTE OF MANAGEMENT AND RESEARCH<br/>
                APJ Abdul Kalam Rd, Knowledge Park III, Greater Noida, Uttar Pradesh 201306
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-b from-white to-slate-50">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-2 flex items-center gap-2">
                <span>🤝</span> Partnership
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Are you an NGO or Veterinarian looking to join the network?
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/onboarding" className="text-sm font-bold text-orange-600 hover:underline">Apply as NGO →</Link>
                <Link href="/vets" className="text-sm font-bold text-blue-600 hover:underline">Apply as Vet →</Link>
              </div>
            </div>

          </div>

          <div className="md:col-span-2">
  <div className="bg-white p-8 md:p-10 rounded-[24px] shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-50">

    <h3 className="text-3xl font-bold text-slate-900 mb-2">
      Send us a Message
    </h3>

    <p className="text-slate-500 mb-8">
      We typically respond within 24 hours.
    </p>

    {submitted ? (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-green-50 text-green-500 border-2 border-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Message Sent!
        </h2>

        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Thank you for contacting AnimalSathi. We’ll get back to you shortly.
        </p>

        <button
          onClick={() => setSubmitted(false)}
          className="bg-slate-100 text-slate-700 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-all"
        >
          Send another message
        </button>
      </div>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-2">
            <label className="font-semibold text-slate-600 ml-1 text-sm">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full bg-white border-2 border-slate-100 rounded-[16px] px-6 py-4 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-600 ml-1 text-sm">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full bg-white border-2 border-slate-100 rounded-[16px] px-6 py-4 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-600 ml-1 text-sm">
            Inquiry Type
          </label>

          <select
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            className="w-full bg-white border-2 border-slate-100 rounded-[16px] px-6 py-4 outline-none focus:border-orange-500 transition-colors"
          >
            <option>General Inquiry</option>
            <option>App Support / Technical Issue</option>
            <option>NGO / Vet Partnership</option>
            <option>Investor / Media Relations</option>
            <option>Donation Question</option>
          </select>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-600 ml-1 text-sm">
            Your Message
          </label>

          <textarea
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="How can we help you and the animals today?"
            className="w-full bg-white border-2 border-slate-100 rounded-[16px] px-6 py-4 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 text-white h-[56px] rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-200 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>

      </form>
    )}
  </div>
</div>

        </div>
      </section>

    </main>
  );
}