"use client";

import { User } from "firebase/auth";

type VerificationStatus = "approved" | "rejected" | "pending";

type UserData = {
  role?: string;
  volunteerApproved?: boolean;
  phone?: string;
  city?: string;
};

type VetData = {
  verificationStatus?: VerificationStatus;
};

type NgoData = {
  verificationStatus?: VerificationStatus;
  ngoName?: string;
  fullAddress?: string;
  hasAmbulance?: boolean;
  hasShelter?: boolean;
  regCert?: string; 
};

export default function ProfileContent({
  user,
  isVolunteer,
  sosCount,
  resolvedCount,
  userData,
  vetData,
  ngoData,
  onEditClick,
  invitations,
  onAcceptInvite,
  onRejectInvite,
  onRequestClick,
}: {
  user: User;
  isVolunteer: boolean;
  sosCount: number;
  resolvedCount: number;
  userData: any;
  vetData: VetData | null;
  ngoData: NgoData | null;
  onEditClick: () => void;
  invitations: any[];
  onAcceptInvite: (invite: any) => void;
  onRejectInvite: (id: string) => void;
  onRequestClick: () => void;
}) {
  return (
    <>
      {/* ... existing stats grid ... */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <StatBox icon="🚨" value={sosCount} label="Reported" />
        {isVolunteer ? (
          <StatBox icon="🐕" value={resolvedCount} label="Helped" />
        ) : (
          <a
            href="/volunteer-form"
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 md:p-5 border border-orange-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="text-2xl md:text-3xl mb-1 md:mb-2 group-hover:scale-110 transition-transform">🤝</div>
            <div className="text-base md:text-lg font-black text-orange-700 leading-tight">Become a Volunteer</div>
            <div className="text-[10px] md:text-xs font-bold text-orange-600 uppercase tracking-wide mt-1">Join team →</div>
          </a>
        )}
      </div>

      {/* Personal details card */}
      <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-5 md:mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800">Personal Info</h3>
          <button
            onClick={onEditClick}
            className="text-sm font-bold text-orange-500 hover:text-orange-600 border border-orange-200 hover:border-orange-400 px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            Edit <span className="hidden sm:inline">✏️</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <DetailField label="Display Name" value={user.displayName ?? "—"} />
          <DetailField label="Email" value={user.email ?? "—"} />
          <DetailField label="Phone" value={userData?.phone ?? "Not set"} />
          <DetailField label="City" value={userData?.city ?? "Not set"} />
        </div>
      </div>

      {/* Organization Membership Card */}
      <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800">Organization</h3>
          {!userData?.organizationId && (
            <button
              onClick={onRequestClick}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-md"
            >
              Join Organization
            </button>
          )}
        </div>

        {userData?.organizationId ? (
          <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-200">🏢</div>
              <div>
                <p className="font-black text-orange-900 leading-tight">{userData.organizationName}</p>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Verified Partner</p>
              </div>
            </div>
            <div className="bg-white text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200">
              Active Member
            </div>
          </div>
        ) : invitations.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Pending Invitations ({invitations.length})</p>
            {invitations.map((invite) => (
              <div key={invite.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl">🤝</div>
                  <div>
                    <p className="font-bold text-slate-800">{invite.orgName}</p>
                    <p className="text-xs text-slate-500">Invited you as {invite.role || "Member"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onRejectInvite(invite.id)} className="px-4 py-2 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-200 transition-colors">Decline</button>
                  <button onClick={() => onAcceptInvite(invite)} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-all shadow-md">Accept & Join</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-3xl mb-2">🏢</div>
            <p className="text-slate-500 font-bold text-sm">Not linked to any organization yet.</p>
            <p className="text-slate-400 text-xs mt-1">Join an NGO or Hospital to access specialized tools.</p>
          </div>
        )}
      </div>

      {/* NGO card */}
      {ngoData && (
        <div className="mt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">NGO Partner Profile</h3>
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <span className="font-bold text-slate-800 text-base md:text-lg">Partnership Status</span>
              <StatusPill status={ngoData.verificationStatus} />
            </div>
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl md:text-2xl border border-orange-100 flex-shrink-0">🏢</div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 text-base md:text-lg truncate">{ngoData.ngoName ?? "NGO Details"}</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1 truncate">{ngoData.fullAddress ?? "No address provided"}</p>
                </div>
              </div>
            </div>
            <div className="p-5 md:p-6 border-b border-slate-100">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 md:mb-4">Operational Capacity</p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <CapacityBadge emoji="🚑" label="Ambulance" active={!!ngoData.hasAmbulance} activeClass="bg-red-50 border-red-200 text-red-700" />
                <CapacityBadge emoji="🏡" label="Shelter" active={!!ngoData.hasShelter} activeClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
              </div>
            </div>
            <a
              href={ngoData.regCert}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 md:p-6 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl md:text-2xl border border-slate-200 group-hover:bg-purple-50 transition-colors flex-shrink-0">📄</div>
                <div>
                  <p className="font-bold text-slate-800 text-base md:text-lg">Registration Cert</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1 hidden sm:block">Tap to view uploaded document</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all flex-shrink-0">→</div>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function StatBox({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
      <div className="text-2xl mb-1 md:mb-2">{icon}</div>
      <div className="text-xl md:text-2xl font-black text-slate-800">{value}</div>
      <div className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs md:text-sm font-semibold text-slate-500 mb-1">{label}</p>
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-slate-800 font-medium text-sm md:text-base break-words">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status?: VerificationStatus }) {
  const styles =
    status === "approved" ? "bg-green-100 text-green-700 border-green-200" :
    status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
    "bg-amber-100 text-amber-700 border-amber-200";
  const label = status === "approved" ? "Verified" : status === "rejected" ? "Rejected" : "Pending Review";
  return (
    <span className={`px-3 py-1.5 md:px-4 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider border whitespace-nowrap inline-block ${styles}`}>
      {label}
    </span>
  );
}

function CapacityBadge({ emoji, label, active, activeClass }: { emoji: string; label: string; active: boolean; activeClass: string }) {
  return (
    <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl border text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 ${active ? activeClass : "bg-slate-50 border-slate-200 text-slate-400"}`}>
      <span>{emoji}</span> <span>{label}</span> <span className="hidden sm:inline">{active ? "Active" : "None"}</span>
    </div>
  );
}