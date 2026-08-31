import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export const runtime = "nodejs";

export interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  text: string;
  verified: boolean;
  createdAt: string;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> | { productId: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const { productId } = params;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const reviewsRef = collection(db, "product_reviews");
    let snapshot;

    try {
      const q = query(
        reviewsRef,
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      snapshot = await getDocs(q);
    } catch (queryErr: any) {
      console.warn(
        "[Reviews Query Fallback]: Composite index missing or building. Falling back to in-memory sort.",
        queryErr?.message
      );
      const fallbackQ = query(
        reviewsRef,
        where("productId", "==", productId),
        limit(50)
      );
      snapshot = await getDocs(fallbackQ);
    }

    const reviews: ReviewItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let formattedDate: string;
      if (data.createdAt instanceof Timestamp) {
        formattedDate = data.createdAt.toDate().toISOString();
      } else if (
        data.createdAt?.toDate &&
        typeof data.createdAt.toDate === "function"
      ) {
        formattedDate = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        formattedDate = data.createdAt;
      } else if (typeof data.createdAt === "number") {
        formattedDate = new Date(data.createdAt).toISOString();
      } else {
        formattedDate = new Date().toISOString();
      }

      reviews.push({
        id: docSnap.id,
        productId: data.productId || productId,
        userId: data.userId || "",
        userName: data.userName || "Anonymous Customer",
        userAvatar: data.userAvatar || null,
        rating: Number(data.rating || 5),
        text: data.text || "",
        verified: data.verified !== false,
        createdAt: formattedDate,
      });
    });

    // In-memory sort by createdAt descending to guarantee chronological order
    reviews.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      reviews,
      total: reviews.length,
    });
  } catch (error: any) {
    console.error("[Get Reviews API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
