"use client";

import Link from "next/link";

export default function CookiePolicyPage() {
  const lastUpdated = "March 28, 2026";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-orange-200 selection:text-orange-900">
      
      {/* PAGE HERO */}
      <section className="relative px-6 pt-20 pb-12 md:pt-32 md:pb-20 text-center max-w-4xl mx-auto flex flex-col items-center border-b border-slate-200/60 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black tracking-widest uppercase mb-6 shadow-sm border border-orange-200">
          Legal & Compliance
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">
          Cookie Policy
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Last Updated: {lastUpdated}
        </p>
      </section>

      {/* CONTENT DOCUMENT */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-12">
          
          {/* Intro */}
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              This Cookie Policy explains how <strong>AnimalSathi</strong> uses cookies and similar technologies to recognize you when you visit our website and use our platform. It explains what these technologies are, why we use them, and your rights to control our use of them.
            </p>
          </div>

          <PolicySection title="1. What are Cookies?">
            <p className="text-slate-600 leading-relaxed">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information. Cookies set by us are called "first-party cookies." Cookies set by parties other than us (such as analytics or authentication providers) are called "third-party cookies."
            </p>
          </PolicySection>

          <PolicySection title="2. How We Use Cookies">
            <p className="text-slate-600 mb-4 leading-relaxed">
              We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate:
            </p>
            <ul className="space-y-3">
              <ListItem title="Essential / Strictly Necessary Cookies:" text="These are crucial for the platform to function. For example, we use Firebase Authentication cookies to keep you safely logged in as a volunteer or NGO, so you don't have to re-enter your password every time you click a new page." />
              <ListItem title="Performance & Analytics Cookies:" text="These help us understand how visitors interact with AnimalSathi. By tracking which pages are visited most often, we can improve the user interface and speed up emergency reporting." />
              <ListItem title="Functionality Cookies:" text="These allow our platform to remember choices you make (such as your preferred language or your region) and provide enhanced, more personal features." />
            </ul>
          </PolicySection>

          <PolicySection title="3. Third-Party Technologies">
            <p className="text-slate-600 leading-relaxed">
              Because AnimalSathi relies on advanced mapping and real-time database infrastructure, we use trusted third-party services like Google Maps and Firebase. These services may place their own cookies on your device to ensure map rendering, location routing, and secure data syncing function properly.
            </p>
          </PolicySection>

          <PolicySection title="4. How Can I Control Cookies?">
            <p className="text-slate-600 mb-4 leading-relaxed">
              You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. 
            </p>
            <p className="text-slate-600 leading-relaxed">
              If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website (such as staying logged into your NGO Dashboard or Volunteer Profile) may be severely restricted or broken.
            </p>
          </PolicySection>

          <PolicySection title="5. Updates to this Policy">
            <p className="text-slate-600 leading-relaxed">
              We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies and related technologies.
            </p>
          </PolicySection>

          <PolicySection title="6. Contact Us">
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about our use of cookies or other technologies, please email our privacy team at:
            </p>
            <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-900">AnimalSathi Privacy Team</p>
              <p className="text-slate-600 mt-1">Email: <a href="mailto:privacy@animalsathi.com" className="text-orange-600 hover:underline">privacy@animalsathi.com</a></p>
            </div>
          </PolicySection>

        </div>
      </section>

      {/* BOTTOM RETURN LINK */}
      <div className="text-center mt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Return to Home
        </Link>
      </div>

    </main>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-10 mt-10 first:border-0 first:pt-0 first:mt-0">
      <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ListItem({ title, text }: { title?: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-orange-500"></div>
      <span className="text-slate-600 font-medium">
        {title && <strong className="text-slate-900 mr-1">{title}</strong>}
        {text}
      </span>
    </li>
  );
}