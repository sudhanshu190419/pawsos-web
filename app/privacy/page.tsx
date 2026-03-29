"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 28, 2026";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-orange-200 selection:text-orange-900">
      
      {/* PAGE HERO */}
      <section className="relative px-6 pt-20 pb-12 md:pt-32 md:pb-20 text-center max-w-4xl mx-auto flex flex-col items-center border-b border-slate-200/60 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black tracking-widest uppercase mb-6 shadow-sm border border-orange-200">
          Legal & Compliance
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">
          Privacy Policy
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
              At <strong>AnimalSathi</strong>, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile application, or participate in our rescue network as a citizen, volunteer, or verified NGO.
            </p>
          </div>

          <PolicySection title="1. Information We Collect">
            <p className="text-slate-600 mb-4 leading-relaxed">
              To provide a rapid and effective animal rescue network, we collect the following types of information:
            </p>
            <ul className="space-y-3">
              <ListItem title="Personal Data:" text="Name, email address, phone number, and profile picture when you register an account." />
              <ListItem title="Location Data (Crucial):" text="Live GPS coordinates when you report an SOS or actively use the app as a volunteer. This is required to route alerts to nearby responders." />
              <ListItem title="Media & Content:" text="Photos, videos, and descriptions of animals you upload during an SOS report or rescue update." />
              <ListItem title="NGO/Vet Verification Data:" text="Registration certificates, 80G documents, and operational addresses submitted during the partnership onboarding process." />
            </ul>
          </PolicySection>

          <PolicySection title="2. How We Use Your Information">
            <p className="text-slate-600 mb-4 leading-relaxed">
              We use the information we collect primarily to facilitate timely animal rescues. Specifically, we use your data to:
            </p>
            <ul className="space-y-3">
              <ListItem text="Broadcast precise SOS location alerts to verified volunteers and NGOs strictly within a 10km radius." />
              <ListItem text="Verify the identity and credentials of organizations and medical professionals joining our network." />
              <ListItem text="Provide real-time updates to the citizen who reported the emergency." />
              <ListItem text="Analyze response times and rescue success rates to improve platform efficiency." />
            </ul>
          </PolicySection>

          <PolicySection title="3. How We Share Your Information">
            <p className="text-slate-600 mb-4 leading-relaxed">
              We do <strong>not</strong> sell your personal data. We share information only in the following ways:
            </p>
            <ul className="space-y-3">
              <ListItem title="With Volunteers & NGOs:" text="When you report an SOS, your first name, reported location, and uploaded media are shared with nearby verified responders so they can find the animal." />
              <ListItem title="With the Public:" text="Resolved rescue stories (before/after photos) may be anonymized and shared on our platform to promote transparency and community impact." />
              <ListItem title="Legal Requirements:" text="If required by law, we may disclose your information in response to a subpoena, court order, or government request." />
            </ul>
          </PolicySection>

          <PolicySection title="4. Data Security & Storage">
            <p className="text-slate-600 leading-relaxed">
              We implement industry-standard security measures, including 256-bit encryption and secure cloud infrastructure via Firebase, to protect your personal information. NGO documents and sensitive verification data are stored in restricted access databases. However, no electronic transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </PolicySection>

          <PolicySection title="5. Your Rights & Controls">
            <p className="text-slate-600 mb-4 leading-relaxed">
              You have full control over your data. Through your account settings, you can:
            </p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3"><span className="text-orange-500 font-bold">»</span> Update or correct your profile information.</li>
              <li className="flex items-start gap-3"><span className="text-orange-500 font-bold">»</span> Toggle location permissions on or off (Note: Turning off location will prevent you from receiving nearby SOS alerts).</li>
              <li className="flex items-start gap-3"><span className="text-orange-500 font-bold">»</span> Request permanent deletion of your account and associated data.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Contact Us">
            <p className="text-slate-600 leading-relaxed">
              If you have questions or comments about this Privacy Policy, or if you wish to exercise your data rights, please contact our Data Protection Officer at:
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
      <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500"></div>
      <span className="text-slate-600 font-medium">
        {title && <strong className="text-slate-900 mr-1">{title}</strong>}
        {text}
      </span>
    </li>
  );
}