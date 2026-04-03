"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";

type ReportStatus = "active" | "responding" | "resolved";

export type SosAlert = {
  id: string;
  createdBy?: string;
  status?: ReportStatus;
  resolvedBy?: string;
  acceptedBy?: string;
  description?: string;
  address?: string;
  photoURL?: string;
  urgency?: string;
  time?: { seconds: number; toDate: () => Date };
};

export function useReports(user: User | null, isVolunteer: boolean) {
  const [reports, setReports] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Use refs so the merge function always sees the latest arrays
  // without needing to be re-subscribed when the other query updates.
  const createdRef = useRef<SosAlert[]>([]);
  const acceptedRef = useRef<SosAlert[]>([]);

  const merge = useCallback(() => {
    const seen = new Set<string>();
    const merged: SosAlert[] = [];
    for (const item of [...createdRef.current, ...acceptedRef.current]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    merged.sort((a, b) => (b.time?.seconds ?? 0) - (a.time?.seconds ?? 0));
    setReports(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsub1 = onSnapshot(
      query(collection(db, "sos_alerts"), where("createdBy", "==", user.uid)),
      (snap) => {
        createdRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SosAlert));
        merge();
      }
    );

    let unsub2 = () => {};
    if (isVolunteer) {
      unsub2 = onSnapshot(
        query(collection(db, "sos_alerts"), where("acceptedBy", "==", user.uid)),
        (snap) => {
          acceptedRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SosAlert));
          merge();
        }
      );
    }

    return () => {
      unsub1();
      unsub2();
    };
  }, [user, isVolunteer, merge]);

  return { reports, loading };
}