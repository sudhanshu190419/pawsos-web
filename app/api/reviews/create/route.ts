import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { productId, rating, text, userName, userAvatar, userId } = body;

    // Validate inputs
    if (!productId || typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!userName || typeof userName !== "string" || !userName.trim()) {
      return NextResponse.json(
        { success: false, error: "User name is required" },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (
      !Number.isInteger(numRating) ||
      numRating < 1 ||
      numRating > 5 ||
      Number.isNaN(numRating)
    ) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const cleanText = typeof text === "string" ? text.trim() : "";
    if (cleanText.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Review text must be at least 5 characters long",
        },
        { status: 400 }
      );
    }

    const reviewRef = doc(collection(db, "product_reviews"));
    const productRef = doc(db, "products", productId.trim());

    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error("Product not found");
      }

      const pData = productSnap.data();
      const prevCount = Number(pData.reviewCount || 0);
      const prevAvg = Number(pData.avgRating || 0);
      const prevDist = pData.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      const nextCount = prevCount + 1;
      const nextAvg =
        Math.round(((prevAvg * prevCount + numRating) / nextCount) * 10) / 10;
      const currentStarCount = Number(prevDist[numRating] || 0);
      const nextStarCount = currentStarCount + 1;

      // 1. Add review doc
      transaction.set(reviewRef, {
        productId: productId.trim(),
        userId: userId.trim(),
        userName: userName.trim() || "Anonymous Customer",
        userAvatar: userAvatar || null,
        rating: numRating,
        text: cleanText,
        verified: true,
        createdAt: serverTimestamp(),
      });

      // 2. Update denormalized aggregates on product doc
      transaction.update(productRef, {
        reviewCount: nextCount,
        avgRating: nextAvg,
        [`ratingDistribution.${numRating}`]: nextStarCount,
      });
    });

    return NextResponse.json({
      success: true,
      reviewId: reviewRef.id,
    });
  } catch (error: any) {
    console.error("[Review Create API Error]:", error);
    if (error?.message === "Product not found") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
