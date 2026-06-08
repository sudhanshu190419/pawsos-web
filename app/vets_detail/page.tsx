"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Loader2,
  Stethoscope,
  ChevronDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { db } from "./../lib/firebase"; 
import { collection, query, getDocs, orderBy, startAt, endAt } from "firebase/firestore";
import * as geofire from 'geofire-common';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  location: { latitude: number; longitude: number };
  distance: number;
  isVerified: boolean;
  availability: string[];
}

export default function NearbyVetsPage() {
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLoc({ lat: latitude, lng: longitude });
          fetchVets(latitude, longitude);
        },
        (err) => {
          console.error("Location error", err);
          setLoading(false);
        }
      );
    }
  }, []);

  const fetchVets = async (lat: number, lng: number) => {
    const radiusInM = 15 * 1000; // Increased to 15km for better variety
    const bounds = geofire.geohashQueryBounds([lat, lng], radiusInM);
    const matching: Clinic[] = [];

    try {
      for (const b of bounds) {
        const collections = ['vet_clinics', 'vets_web'];
        for (const colName of collections) {
          const q = query(
            collection(db, colName),
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1])
          );

          const snap = await getDocs(q);
          snap.docs.forEach((doc) => {
            const data = doc.data();
            if (!data.location) return;

            const distanceInKm = geofire.distanceBetween(
              [lat, lng],
              [data.location.latitude, data.location.longitude]
            );

            if (distanceInKm * 1000 <= radiusInM) {
              const isVerified = colName === 'vets_web' && data.verificationStatus === 'approved';
              if (colName === 'vets_web' && !isVerified) return;

              matching.push({
                id: doc.id,
                name: isVerified ? data.fullName : data.name,
                address: isVerified ? data.clinicAddress : data.address,
                city: data.city || '',
                state: data.state || data.serviceArea || '',
                phone: data.phone,
                location: data.location,
                distance: distanceInKm,
                isVerified: isVerified,
                availability: data.availability || [],
              });
            }
          });
        }
      }
      matching.sort((a, b) => a.distance - b.distance);
      setAllClinics(matching);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleClinics = useMemo(() => {
    return allClinics.slice(0, visibleCount);
  }, [allClinics, visibleCount]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-orange-100">
      
      {/* --- PREMIUM HERO SECTION --- */}
      <section className="relative pt-16 pb-12 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-orange-100/40 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-100 px-4 py-2 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-orange-600 font-bold text-xs uppercase tracking-widest">Premium Care Network</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Trusted Vets <span className="text-orange-500">Nearby</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            Connecting you with top-rated medical professionals for your companions within minutes.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto p-6 md:px-12 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <div className="absolute inset-0 bg-orange-200 blur-xl opacity-20 animate-pulse" />
            </div>
            <p className="text-slate-400 font-medium mt-6 tracking-wide uppercase text-xs">Scanning Local Area...</p>
          </div>
        ) : allClinics.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <Stethoscope className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Specialists Found</h3>
            <p className="text-slate-400 max-w-xs mx-auto">We couldn't find any clinics within 15km of your current location.</p>
            <Link href="/" className="mt-8 inline-block text-orange-500 font-bold hover:underline">Return Home</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {visibleClinics.map((clinic) => (
                <div 
                  key={clinic.id} 
                  className="group relative bg-white rounded-[1.75rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col"
                >
                  {/* Verified Badge */}
                  {clinic.isVerified && (
                    <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white p-1.5 rounded-full shadow-lg shadow-green-200 border-4 border-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                          {clinic.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1">
                           <MapPin className="w-3 h-3 text-orange-400" />
                           <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                            {clinic.distance.toFixed(1)} Kilometers Away
                           </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                      {clinic.address}, {clinic.city}
                    </p>

                    {clinic.availability.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {clinic.availability.slice(0, 3).map((tag, i) => (
                          <span key={i} className="bg-slate-50 text-slate-500 border border-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <a
                      href={`tel:${clinic.phone}`}
                      className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-[0.97] transition-all shadow-md shadow-slate-200"
                    >
                      <Phone className="w-4 h-4" /> Contact
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.latitude},${clinic.location.longitude}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 active:scale-[0.97] transition-all shadow-md shadow-orange-100"
                    >
                      <Navigation className="w-4 h-4" /> Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* --- LOAD MORE OPTION --- */}
            {visibleCount < allClinics.length && (
              <div className="mt-16 flex justify-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="group flex flex-col items-center gap-3 transition-all active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                    <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-orange-500 group-hover:translate-y-1 transition-all" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-orange-500 transition-colors">
                    Load More Results
                  </span>
                </button>
              </div>
            )}
            
            <p className="text-center mt-12 text-slate-400 text-xs font-medium">
               Showing {visibleClinics.length} of {allClinics.length} trusted partners
            </p>
          </>
        )}
      </main>
    </div>
  );
}