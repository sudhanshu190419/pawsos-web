"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  orderBy,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { User } from "firebase/auth";
import { geohashForLocation, distanceBetween } from "geofire-common";

/* ── Types ─────────────────────────────────────────────────── */

export type PetType = "dog" | "cat" | "bird" | "rabbit" | "other";

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: string;
  gender: "male" | "female";
  temperament: string;
  photoURL: string;
  ownerId: string;
  vaccinated: boolean;
  createdAt: any;
}

export interface PlaydateAttendee {
  uid: string;
  petId: string;
}

export interface Playdate {
  id: string;
  title: string;
  description: string;
  petType: PetType | "all";
  date: Timestamp;
  locationName: string;
  location: GeoPoint;
  locationLat: number;
  locationLng: number;
  maxPets: number;
  createdBy: string;
  creatorName: string;
  creatorPhoto: string;
  hostPetId?: string;
  attendees: PlaydateAttendee[];
  attendeeCount: number;
  status: "upcoming" | "completed" | "cancelled";
  geohash: string;
  createdAt: any;
}

/* ── Pet helpers ───────────────────────────────────────────── */

export function useUserPets(user: User | null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "pets"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { pets, loading, hasPets: pets.length > 0 };
}

export async function registerPet(
  data: Omit<Pet, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "pets"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function fetchPetById(petId: string): Promise<Pet | null> {
  const snap = await getDoc(doc(db, "pets", petId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Pet;
}

export async function fetchPetsByIds(petIds: string[]): Promise<Pet[]> {
  if (petIds.length === 0) return [];
  const results: Pet[] = [];
  // Firestore `in` queries are limited to 30 items
  const chunks = [];
  for (let i = 0; i < petIds.length; i += 30) {
    chunks.push(petIds.slice(i, i + 30));
  }
  for (const chunk of chunks) {
    const q = query(
      collection(db, "pets"),
      where("__name__", "in", chunk)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => results.push({ id: d.id, ...d.data() } as Pet));
  }
  return results;
}

/* ── Playdate list hook ────────────────────────────────────── */

export interface PlaydateFilters {
  petType?: PetType | "all";
  radiusKm?: number;
  userLocation?: { latitude: number; longitude: number };
}

export function usePlaydates(filters?: PlaydateFilters) {
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [loading, setLoading] = useState(true);
  const filter = filters?.petType || "all";
  const radiusKm = filters?.radiusKm || 25;
  const userLocation = filters?.userLocation;

  useEffect(() => {
    const constraints: any[] = [
      where("status", "==", "upcoming"),
      orderBy("date", "asc"),
    ];
    if (filter !== "all") {
      constraints.push(where("petType", "in", [filter, "all"]));
    }

    const q = query(collection(db, "playdates"), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      let items = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Playdate)
      );

      // Filter by distance if user location is provided
      if (userLocation) {
        items = items.filter((playdate) => {
          const distance = distanceBetween(
            [userLocation.latitude, userLocation.longitude],
            [playdate.locationLat, playdate.locationLng]
          );
          return distance <= radiusKm;
        });
      }

      setPlaydates(items);
      setLoading(false);
    });
    return () => unsub();
  }, [filter, radiusKm, userLocation]);

  return { playdates, loading };
}

/* ── Single playdate hook ──────────────────────────────────── */

export function usePlaydate(id: string) {
  const [playdate, setPlaydate] = useState<Playdate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "playdates", id), (snap) => {
      if (snap.exists()) {
        setPlaydate({ id: snap.id, ...snap.data() } as Playdate);
      } else {
        setPlaydate(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  return { playdate, loading };
}

/* ── Create playdate ───────────────────────────────────────── */

export interface CreatePlaydateInput {
  title: string;
  description: string;
  petType: PetType | "all";
  date: Date;
  locationName: string;
  location: GeoPoint;
  locationLat: number;
  locationLng: number;
  maxPets: number;
  createdBy: string;
  creatorName: string;
  creatorPhoto: string;
  hostPetId?: string;
}

export async function createPlaydate(
  data: CreatePlaydateInput
): Promise<string> {
  const geohash = geohashForLocation([data.locationLat, data.locationLng]);
  const docRef = await addDoc(collection(db, "playdates"), {
    title: data.title,
    description: data.description,
    petType: data.petType,
    date: Timestamp.fromDate(data.date),
    locationName: data.locationName,
    location: data.location,
    locationLat: data.locationLat,
    locationLng: data.locationLng,
    maxPets: data.maxPets,
    createdBy: data.createdBy,
    creatorName: data.creatorName,
    creatorPhoto: data.creatorPhoto,
    hostPetId: data.hostPetId,
    attendees: [],
    attendeeCount: 0,
    status: "upcoming",
    geohash,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/* ── Join / Leave playdate ─────────────────────────────────── */

export async function joinPlaydate(
  playdateId: string,
  uid: string,
  petId: string
) {
  const ref = doc(db, "playdates", playdateId);
  await updateDoc(ref, {
    attendees: arrayUnion({ uid, petId }),
    attendeeCount: increment(1),
  });
}

export async function leavePlaydate(
  playdateId: string,
  uid: string,
  petId: string
) {
  const ref = doc(db, "playdates", playdateId);
  await updateDoc(ref, {
    attendees: arrayRemove({ uid, petId }),
    attendeeCount: increment(-1),
  });
}
