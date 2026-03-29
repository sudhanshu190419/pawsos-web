"use client";

import Link from "next/link";

export default function TermsOfServicePage() {
  const lastUpdated = "March 28, 2026";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-orange-200 selection:text-orange-900">
      
      {/* PAGE HERO */}
      <section className="relative px-6 pt-20 pb-12 md:pt-32 md:pb-20 text-center max-w-4xl mx-auto flex flex-col items-center border-b border-slate-200/60 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black tracking-widest uppercase mb-6 shadow-sm border border-orange-200">
          Legal & Compliance
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">
          Terms of Service
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
              Welcome to <strong>AnimalSathi</strong>. These Terms of Service ("Terms") govern your use of our website, mobile application, and related services. By accessing or using AnimalSathi, you agree to be bound by these Terms. If you do not agree with these Terms, please do not use our platform.
            </p>
          </div>

          <PolicySection title="1. Platform Role & Disclaimer">
            <p className="text-slate-600 mb-4 leading-relaxed">
              AnimalSathi is a technology platform designed to facilitate communication between citizens reporting animal emergencies and verified volunteers, NGOs, and veterinary professionals.
            </p>
            <ul className="space-y-3">
              <ListItem title="Not a Medical Provider:" text="AnimalSathi does not provide direct veterinary advice, medical services, or rescue operations. We are strictly a routing and coordination network." />
              <ListItem title="Assumption of Risk:" text="Handling distressed or injured animals carries inherent risks of injury or disease. Volunteers, NGOs, and citizens engaging in physical rescue activities do so entirely at their own risk." />
              <ListItem title="No Guarantee of Rescue:" text="While we route SOS alerts instantly, we cannot guarantee that a volunteer or NGO will be available or successfully rescue the animal in every instance." />
            </ul>
          </PolicySection>

          <PolicySection title="2. User Accounts & Responsibilities">
            <p className="text-slate-600 mb-4 leading-relaxed">
              To use certain features of the platform, you must register for an account. You agree to:
            </p>
            <ul className="space-y-3">
              <ListItem text="Provide accurate, current, and complete information during the registration process." />
              <ListItem text="Maintain the security and confidentiality of your account password." />
              <ListItem text="Notify us immediately of any unauthorized use of your account." />
              <ListItem text="Accept responsibility for all activities that occur under your account." />
            </ul>
          </PolicySection>

          <PolicySection title="3. SOS Reporting Rules">
            <p className="text-slate-600 mb-4 leading-relaxed">
              The SOS feature is strictly for genuine animal emergencies. Misuse of this system costs lives by diverting resources. You agree that you will <strong>NOT</strong>:
            </p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3"><span className="text-red-500 font-bold">✕</span> Submit false, prank, or misleading emergency reports.</li>
              <li className="flex items-start gap-3"><span className="text-red-500 font-bold">✕</span> Upload graphic, violent, or inappropriate media that is not directly relevant to the animal's medical condition.</li>
              <li className="flex items-start gap-3"><span className="text-red-500 font-bold">✕</span> Spam the network with duplicate reports for the same incident.</li>
            </ul>
            <p className="text-slate-500 mt-4 text-sm font-medium italic">
              *Violation of these rules will result in an immediate and permanent ban from the AnimalSathi network.
            </p>
          </PolicySection>

          <PolicySection title="4. NGO & Volunteer Verification">
            <p className="text-slate-600 leading-relaxed">
              NGOs and medical professionals must submit valid documentation (e.g., 80G, 12A, or veterinary licenses) to receive verified status. AnimalSathi reserves the right to approve, reject, or revoke verified status at our sole discretion based on compliance, community feedback, or legal standing.
            </p>
          </PolicySection>

          <PolicySection title="5. Limitation of Liability">
            <p className="text-slate-600 leading-relaxed">
              To the maximum extent permitted by law, AnimalSathi, its founders, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or physical injury resulting from your use of the platform, interactions with other users, or participation in physical animal rescues.
            </p>
          </PolicySection>

          <PolicySection title="6. Modifications to the Service">
            <p className="text-slate-600 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the platform at any time without prior notice. We may also update these Terms from time to time. Continued use of the platform following the posting of revised Terms means that you accept and agree to the changes.
            </p>
          </PolicySection>

          <PolicySection title="7. Contact Information">
            <p className="text-slate-600 leading-relaxed">
              If you have any questions, concerns, or legal inquiries regarding these Terms of Service, please reach out to our legal team:
            </p>
            <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-900">AnimalSathi Legal Department</p>
              <p className="text-slate-600 mt-1">Email: <a href="mailto:legal@animalsathi.com" className="text-orange-600 hover:underline">legal@animalsathi.com</a></p>
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
      <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-slate-800"></div>
      <span className="text-slate-600 font-medium">
        {title && <strong className="text-slate-900 mr-1">{title}</strong>}
        {text}
      </span>
    </li>
  );
}