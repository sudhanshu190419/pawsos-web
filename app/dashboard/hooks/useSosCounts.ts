"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";

export function useSosCounts(user: User | null, isVolunteer: boolean) {
  const [sosCount, setSosCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubSos = onSnapshot(
      query(collection(db, "sos_alerts"), where("createdBy", "==", user.uid)),
      (snap) => setSosCount(snap.size)
    );

    let unsubResolved = () => {};
    if (isVolunteer) {
      unsubResolved = onSnapshot(
        query(
          collection(db, "sos_alerts"),
          where("status", "==", "resolved"),
          where("resolvedBy", "==", user.uid)
        ),
        (snap) => setResolvedCount(snap.size)
      );
    }

    return () => {
      unsubSos();
      unsubResolved();
    };
  }, [user, isVolunteer]);

  return { sosCount, resolvedCount };
}