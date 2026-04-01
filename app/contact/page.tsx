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
              <a href="mailto:support@animalsathi.org" className="font-black text-orange-600 text-sm sm:text-base hover:text-orange-700 transition-colors break-all">
                support@animalsathi.org
              </a>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 border border-blue-100">📍</div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 sm:mb-2">Headquarters</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4">Come say hello at our office.</p>
              <p className="font-bold text-slate-700 text-sm leading-relaxed">
                Greater Noida<br/>
                Uttar Pradesh, India
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
                <Link href="/vet-onboarding" className="text-sm font-bold text-blue-600 hover:underline">Apply as Vet →</Link>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              
              {/* Decorative corner shape */}
              <div className="absolute -top-16 -right-16 sm:-top-24 sm:-right-24 w-32 h-32 sm:w-48 sm:h-48 bg-orange-50 rounded-full blur-2xl sm:blur-3xl"></div>

              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 sm:py-20 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 text-green-500 border-2 border-green-100 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm">
                    ✓
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 sm:mb-4">Message Sent!</h2>
                  <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-6 sm:mb-8">
                    Thank you for reaching out. A member of the AnimalSathi team will get back to you within 24-48 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto bg-slate-100 text-slate-600 px-6 sm:px-8 py-3.5 sm:py-3 rounded-full font-bold text-sm sm:text-base hover:bg-slate-200 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative z-10 space-y-5 sm:space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1">Your Name</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1">What is this regarding?</label>
                    <select 
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-sm sm:text-base text-slate-700 cursor-pointer appearance-none"
                    >
                      <option>General Inquiry</option>
                      <option>App Support / Technical Issue</option>
                      <option>NGO / Vet Partnership</option>
                      <option>Investor / Media Relations</option>
                      <option>Donation Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1">Message</label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800 resize-none"
                      placeholder="How can we help you today?"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-600 shadow-lg hover:shadow-orange-200 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-900 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
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